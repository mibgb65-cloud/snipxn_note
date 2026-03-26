package com.snipxn.community.service;

import com.snipxn.common.result.PageResult;
import com.snipxn.community.dto.req.CreateCommentRequest;
import com.snipxn.community.dto.resp.CommentResponse;

public interface CommentService {

    PageResult<CommentResponse> listTopLevelComments(String postId, String currentUserId, int page, int size);

    PageResult<CommentResponse> listReplies(String commentId, String currentUserId, int page, int size);

    CommentResponse createComment(String userId, String postId, CreateCommentRequest req);

    void deleteComment(String userId, String commentId);

    void likeComment(String userId, String commentId);

    void unlikeComment(String userId, String commentId);
}
