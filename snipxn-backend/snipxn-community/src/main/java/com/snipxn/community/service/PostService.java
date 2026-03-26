package com.snipxn.community.service;

import com.snipxn.common.result.PageResult;
import com.snipxn.community.dto.req.CreatePostRequest;
import com.snipxn.community.dto.resp.PostDetailResponse;
import com.snipxn.community.dto.resp.PostListItemResponse;
import com.snipxn.community.dto.resp.PublicPostResponse;
import com.snipxn.community.dto.resp.SharePostResponse;

public interface PostService {

    PageResult<PostListItemResponse> listPosts(int page, int size);

    PageResult<PostListItemResponse> listUserPosts(String userId, int page, int size);

    PostDetailResponse getPost(String postId, String currentUserId);

    PostDetailResponse createPost(String userId, CreatePostRequest req);

    void deletePost(String userId, String postId);

    void recordView(String postId);

    SharePostResponse sharePost(String userId, String postId);

    SharePostResponse checkShareStatus(String userId, String postId);

    void cancelShare(String userId, String postId);

    PublicPostResponse getPublicPost(String shareToken);

    PageResult<PostListItemResponse> listHotPosts(int page, int size);
}
