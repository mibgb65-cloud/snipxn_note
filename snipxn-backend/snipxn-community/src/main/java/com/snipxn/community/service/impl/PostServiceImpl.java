package com.snipxn.community.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.common.result.PageResult;
import com.snipxn.community.dto.req.CreatePostRequest;
import com.snipxn.community.dto.resp.PostDetailResponse;
import com.snipxn.community.dto.resp.PostListItemResponse;
import com.snipxn.community.entity.Post;
import com.snipxn.community.mapper.InteractionMapper;
import com.snipxn.community.mapper.PostMapper;
import com.snipxn.community.mq.message.ViewCountMessage;
import com.snipxn.community.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
public class PostServiceImpl implements PostService {

    private static final String POST_STATUS_PUBLISHED = "PUBLISHED";
    private static final String POST_STATUS_HIDDEN = "HIDDEN";
    private static final String ACTION_LIKE = "LIKE";
    private static final String ACTION_COLLECT = "COLLECT";
    private static final String COMMUNITY_EXCHANGE = "snipxn.community.exchange";
    private static final String VIEW_COUNT_ROUTING_KEY = "view.count";
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final PostMapper postMapper;
    private final InteractionMapper interactionMapper;
    private final UserMapper userMapper;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public PageResult<PostListItemResponse> listPosts(int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;

        List<Post> posts = postMapper.selectPublishedPage(pageSize, offset);
        long total = postMapper.countPublished();
        Map<String, User> authors = getAuthorsByUserId(posts);
        List<PostListItemResponse> records = posts.stream()
                .map(post -> toListItemResponse(post, authors.get(post.getUserId())))
                .toList();

        return buildPageResult(current, pageSize, total, records);
    }

    @Override
    public PageResult<PostListItemResponse> listUserPosts(String userId, int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;

        List<Post> posts = postMapper.selectByUserPage(userId, pageSize, offset);
        long total = postMapper.countByUser(userId);
        Map<String, User> authors = getAuthorsByUserId(posts);
        List<PostListItemResponse> records = posts.stream()
                .map(post -> toListItemResponse(post, authors.get(post.getUserId())))
                .toList();

        return buildPageResult(current, pageSize, total, records);
    }

    @Override
    public PostDetailResponse getPost(String postId, String currentUserId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !POST_STATUS_PUBLISHED.equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        User author = userMapper.selectById(post.getUserId());
        boolean liked = false;
        boolean collected = false;
        if (StringUtils.hasText(currentUserId)) {
            List<String> actionTypes = interactionMapper.selectActionTypes(currentUserId, postId);
            liked = actionTypes.contains(ACTION_LIKE);
            collected = actionTypes.contains(ACTION_COLLECT);
        }

        recordView(postId);
        return toDetailResponse(post, author, liked, collected);
    }

    @Override
    @Transactional
    public PostDetailResponse createPost(String userId, CreatePostRequest req) {
        Post post = new Post();
        post.setUserId(userId);
        post.setOriginNoteId(req.getOriginNoteId());
        post.setTitle(req.getTitle());
        post.setContent(req.getContent());
        post.setLanguage(req.getLanguage());
        post.setTags(serializeTags(req.getTags()));
        post.setViewCount(0L);
        post.setLikeCount(0L);
        post.setCollectCount(0L);
        post.setCommentCount(0L);
        post.setStatus(POST_STATUS_PUBLISHED);
        postMapper.insert(post);

        User author = userMapper.selectById(userId);
        return toDetailResponse(post, author, false, false);
    }

    @Override
    @Transactional
    public void deletePost(String userId, String postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
        if (!userId.equals(post.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (POST_STATUS_HIDDEN.equals(post.getStatus())) {
            return;
        }
        post.setStatus(POST_STATUS_HIDDEN);
        postMapper.updateById(post);
    }

    @Override
    public void recordView(String postId) {
        rabbitTemplate.convertAndSend(COMMUNITY_EXCHANGE, VIEW_COUNT_ROUTING_KEY, new ViewCountMessage(postId));
    }

    private PageResult<PostListItemResponse> buildPageResult(long current,
                                                             long size,
                                                             long total,
                                                             List<PostListItemResponse> records) {
        Page<PostListItemResponse> page = new Page<>(current, size, total);
        page.setRecords(records);
        return PageResult.of(page);
    }

    private Map<String, User> getAuthorsByUserId(List<Post> posts) {
        if (posts.isEmpty()) {
            return Map.of();
        }

        Set<String> userIds = posts.stream()
                .map(Post::getUserId)
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (userIds.isEmpty()) {
            return Map.of();
        }

        return userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private PostListItemResponse toListItemResponse(Post post, User author) {
        PostListItemResponse response = new PostListItemResponse();
        response.setId(post.getId());
        response.setUserId(post.getUserId());
        response.setTitle(post.getTitle());
        response.setLanguage(post.getLanguage());
        response.setTags(parseTags(post.getTags()));
        response.setViewCount(defaultCount(post.getViewCount()));
        response.setLikeCount(defaultCount(post.getLikeCount()));
        response.setCollectCount(defaultCount(post.getCollectCount()));
        response.setCommentCount(defaultCount(post.getCommentCount()));
        response.setStatus(post.getStatus());
        response.setCreatedAt(post.getCreatedAt());
        if (author != null) {
            response.setAuthorNickname(author.getNickname());
            response.setAuthorAvatar(author.getAvatar());
        }
        return response;
    }

    private PostDetailResponse toDetailResponse(Post post, User author, boolean liked, boolean collected) {
        PostDetailResponse response = new PostDetailResponse();
        response.setId(post.getId());
        response.setUserId(post.getUserId());
        response.setOriginNoteId(post.getOriginNoteId());
        response.setTitle(post.getTitle());
        response.setContent(post.getContent());
        response.setLanguage(post.getLanguage());
        response.setTags(parseTags(post.getTags()));
        response.setViewCount(defaultCount(post.getViewCount()));
        response.setLikeCount(defaultCount(post.getLikeCount()));
        response.setCollectCount(defaultCount(post.getCollectCount()));
        response.setCommentCount(defaultCount(post.getCommentCount()));
        response.setStatus(post.getStatus());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        if (author != null) {
            response.setAuthorNickname(author.getNickname());
            response.setAuthorAvatar(author.getAvatar());
        }
        response.setLiked(liked);
        response.setCollected(collected);
        return response;
    }

    private List<String> parseTags(String tagsJson) {
        if (!StringUtils.hasText(tagsJson)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(tagsJson, STRING_LIST_TYPE);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "帖子标签解析失败");
        }
    }

    private String serializeTags(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags == null ? List.of() : tags);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "帖子标签序列化失败");
        }
    }

    private long defaultCount(Long count) {
        return count == null ? 0L : count;
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
