package com.snipxn.community.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.common.result.PageResult;
import com.snipxn.community.dto.req.CreateCommentRequest;
import com.snipxn.community.dto.resp.CommentResponse;
import com.snipxn.community.entity.Comment;
import com.snipxn.community.entity.Interaction;
import com.snipxn.community.entity.Post;
import com.snipxn.community.mapper.CommentMapper;
import com.snipxn.community.mapper.InteractionMapper;
import com.snipxn.community.mapper.PostMapper;
import com.snipxn.community.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private static final String POST_STATUS_PUBLISHED = "PUBLISHED";
    private static final String COMMENT_STATUS_VISIBLE = "VISIBLE";
    private static final String COMMENT_STATUS_DELETED = "DELETED";
    private static final String TARGET_TYPE_COMMENT = "COMMENT";
    private static final String ACTION_TYPE_LIKE = "LIKE";

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final InteractionMapper interactionMapper;

    @Override
    public PageResult<CommentResponse> listTopLevelComments(String postId, String currentUserId, int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;

        List<Comment> comments = commentMapper.selectTopLevelByPost(postId, pageSize, offset);
        long total = commentMapper.countTopLevelByPost(postId);

        List<CommentResponse> records = toResponses(comments, currentUserId, true);

        Page<CommentResponse> pageObj = new Page<>(current, pageSize, total);
        pageObj.setRecords(records);
        return PageResult.of(pageObj);
    }

    @Override
    public PageResult<CommentResponse> listReplies(String commentId, String currentUserId, int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;

        List<Comment> comments = commentMapper.selectRepliesByParent(commentId, pageSize, offset);
        long total = commentMapper.countRepliesByParent(commentId);

        List<CommentResponse> records = toResponses(comments, currentUserId, false);

        Page<CommentResponse> pageObj = new Page<>(current, pageSize, total);
        pageObj.setRecords(records);
        return PageResult.of(pageObj);
    }

    @Override
    @Transactional
    public CommentResponse createComment(String userId, String postId, CreateCommentRequest req) {
        Post post = postMapper.selectById(postId);
        if (post == null || !POST_STATUS_PUBLISHED.equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        String actualParentId = null;
        String replyToUserId = null;

        if (StringUtils.hasText(req.getParentId())) {
            Comment target = commentMapper.selectById(req.getParentId());
            if (target == null || !COMMENT_STATUS_VISIBLE.equals(target.getStatus())) {
                throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
            }

            if (target.getParentId() != null) {
                // 回复的是一条"回复"（二级评论），重定向到顶级评论，并记录 @对象
                actualParentId = target.getParentId();
                replyToUserId = target.getUserId();
            } else {
                // 回复的是顶级评论
                actualParentId = target.getId();
                replyToUserId = target.getUserId();
            }
        }

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setParentId(actualParentId);
        comment.setReplyToUserId(replyToUserId);
        comment.setContent(req.getContent());
        comment.setLikeCount(0L);
        comment.setStatus(COMMENT_STATUS_VISIBLE);
        commentMapper.insert(comment);

        postMapper.updateCommentCount(postId, 1);

        User author = userMapper.selectById(userId);
        User replyToUser = StringUtils.hasText(replyToUserId) ? userMapper.selectById(replyToUserId) : null;
        return toResponse(comment, author, replyToUser, 0L, false);
    }

    @Override
    @Transactional
    public void deleteComment(String userId, String commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null || COMMENT_STATUS_DELETED.equals(comment.getStatus())) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        if (!userId.equals(comment.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        comment.setStatus(COMMENT_STATUS_DELETED);
        commentMapper.updateById(comment);

        int delta;
        if (comment.getParentId() == null) {
            long visibleReplies = commentMapper.countVisibleReplies(commentId);
            delta = (int) -(1 + visibleReplies);
        } else {
            delta = -1;
        }
        postMapper.updateCommentCount(comment.getPostId(), delta);
    }

    @Override
    @Transactional
    public void likeComment(String userId, String commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null || !COMMENT_STATUS_VISIBLE.equals(comment.getStatus())) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        Interaction interaction = new Interaction();
        interaction.setUserId(userId);
        interaction.setTargetId(commentId);
        interaction.setTargetType(TARGET_TYPE_COMMENT);
        interaction.setActionType(ACTION_TYPE_LIKE);

        try {
            interactionMapper.insert(interaction);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.COMMENT_ALREADY_LIKED);
        }

        commentMapper.updateLikeCount(commentId, 1);
    }

    @Override
    @Transactional
    public void unlikeComment(String userId, String commentId) {
        int deleted = interactionMapper.deleteInteraction(userId, commentId, ACTION_TYPE_LIKE);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        commentMapper.updateLikeCount(commentId, -1);
    }

    private List<CommentResponse> toResponses(List<Comment> comments, String currentUserId, boolean loadReplyCount) {
        if (comments.isEmpty()) {
            return List.of();
        }

        // 收集所有需要加载的用户 ID（评论作者 + 回复对象）
        Set<String> userIds = new LinkedHashSet<>();
        for (Comment c : comments) {
            if (StringUtils.hasText(c.getUserId())) userIds.add(c.getUserId());
            if (StringUtils.hasText(c.getReplyToUserId())) userIds.add(c.getReplyToUserId());
        }

        Map<String, User> users = userIds.isEmpty() ? Map.of()
                : userMapper.selectBatchIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        Set<String> likedCommentIds = Set.of();
        if (StringUtils.hasText(currentUserId)) {
            List<String> commentIds = comments.stream().map(Comment::getId).toList();
            likedCommentIds = commentIds.stream()
                    .filter(cid -> !interactionMapper.selectActionTypes(currentUserId, cid).isEmpty())
                    .collect(Collectors.toSet());
        }

        Set<String> finalLikedIds = likedCommentIds;
        return comments.stream().map(comment -> {
            User author = users.get(comment.getUserId());
            User replyToUser = StringUtils.hasText(comment.getReplyToUserId())
                    ? users.get(comment.getReplyToUserId()) : null;
            long replyCount = loadReplyCount ? commentMapper.countRepliesByParent(comment.getId()) : 0L;
            boolean liked = finalLikedIds.contains(comment.getId());
            return toResponse(comment, author, replyToUser, replyCount, liked);
        }).toList();
    }

    private CommentResponse toResponse(Comment comment, User author, User replyToUser,
                                        long replyCount, boolean liked) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setPostId(comment.getPostId());
        response.setUserId(comment.getUserId());
        response.setParentId(comment.getParentId());
        response.setReplyToUserId(comment.getReplyToUserId());
        if (replyToUser != null) {
            response.setReplyToNickname(replyToUser.getNickname());
        }
        response.setContent(comment.getContent());
        response.setLikeCount(comment.getLikeCount() == null ? 0L : comment.getLikeCount());
        response.setReplyCount(replyCount);
        response.setCreatedAt(comment.getCreatedAt());
        if (author != null) {
            response.setAuthorNickname(author.getNickname());
            response.setAuthorAvatar(author.getAvatar());
        }
        response.setLiked(liked);
        return response;
    }

    private long normalizePage(int page) {
        return Math.max(page, 1);
    }

    private long normalizeSize(int size) {
        if (size <= 0) {
            return 20;
        }
        return Math.min(size, 50);
    }
}
