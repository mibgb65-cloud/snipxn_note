package com.snipxn.community.service.impl;

import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.community.entity.Interaction;
import com.snipxn.community.entity.Post;
import com.snipxn.community.mapper.InteractionMapper;
import com.snipxn.community.mapper.PostMapper;
import com.snipxn.community.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InteractionServiceImpl implements InteractionService {

    private static final String POST_STATUS_PUBLISHED = "PUBLISHED";
    private static final String TARGET_TYPE_POST = "POST";
    private static final String ACTION_TYPE_LIKE = "LIKE";
    private static final String ACTION_TYPE_COLLECT = "COLLECT";

    private final InteractionMapper interactionMapper;
    private final PostMapper postMapper;

    @Override
    @Transactional
    public void like(String userId, String postId) {
        ensurePostExists(postId);
        try {
            interactionMapper.insert(buildInteraction(userId, postId, ACTION_TYPE_LIKE));
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.POST_ALREADY_LIKED);
        }
        postMapper.updateLikeCount(postId, 1);
    }

    @Override
    @Transactional
    public void unlike(String userId, String postId) {
        int deleted = interactionMapper.deleteInteraction(userId, postId, ACTION_TYPE_LIKE);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        postMapper.updateLikeCount(postId, -1);
    }

    @Override
    @Transactional
    public void collect(String userId, String postId) {
        ensurePostExists(postId);
        try {
            interactionMapper.insert(buildInteraction(userId, postId, ACTION_TYPE_COLLECT));
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.POST_ALREADY_COLLECTED);
        }
        postMapper.updateCollectCount(postId, 1);
    }

    @Override
    @Transactional
    public void uncollect(String userId, String postId) {
        int deleted = interactionMapper.deleteInteraction(userId, postId, ACTION_TYPE_COLLECT);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        postMapper.updateCollectCount(postId, -1);
    }

    private void ensurePostExists(String postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !POST_STATUS_PUBLISHED.equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
    }

    private Interaction buildInteraction(String userId, String postId, String actionType) {
        Interaction interaction = new Interaction();
        interaction.setUserId(userId);
        interaction.setTargetId(postId);
        interaction.setTargetType(TARGET_TYPE_POST);
        interaction.setActionType(actionType);
        return interaction;
    }
}
