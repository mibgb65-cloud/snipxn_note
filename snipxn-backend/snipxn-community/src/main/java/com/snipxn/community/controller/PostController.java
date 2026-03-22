package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.req.CreatePostRequest;
import com.snipxn.community.dto.resp.PostDetailResponse;
import com.snipxn.community.dto.resp.PostListItemResponse;
import com.snipxn.community.service.InteractionService;
import com.snipxn.community.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final InteractionService interactionService;

    @GetMapping
    public Result<PageResult<PostListItemResponse>> listPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(postService.listPosts(page, size));
    }

    @GetMapping("/user/{userId}")
    public Result<PageResult<PostListItemResponse>> listUserPosts(
            @PathVariable String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(postService.listUserPosts(userId, page, size));
    }

    @GetMapping("/{postId}")
    public Result<PostDetailResponse> getPost(
            @PathVariable String postId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(postService.getPost(postId, currentUserId));
    }

    @PostMapping
    public Result<PostDetailResponse> createPost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePostRequest req) {
        return Result.success(postService.createPost(userDetails.getUserId(), req));
    }

    @DeleteMapping("/{postId}")
    public Result<Void> deletePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String postId) {
        postService.deletePost(userDetails.getUserId(), postId);
        return Result.success();
    }

    @PostMapping("/{postId}/like")
    public Result<Void> like(@AuthenticationPrincipal CustomUserDetails userDetails,
                             @PathVariable String postId) {
        interactionService.like(userDetails.getUserId(), postId);
        return Result.success();
    }

    @DeleteMapping("/{postId}/like")
    public Result<Void> unlike(@AuthenticationPrincipal CustomUserDetails userDetails,
                               @PathVariable String postId) {
        interactionService.unlike(userDetails.getUserId(), postId);
        return Result.success();
    }

    @PostMapping("/{postId}/collect")
    public Result<Void> collect(@AuthenticationPrincipal CustomUserDetails userDetails,
                                @PathVariable String postId) {
        interactionService.collect(userDetails.getUserId(), postId);
        return Result.success();
    }

    @DeleteMapping("/{postId}/collect")
    public Result<Void> uncollect(@AuthenticationPrincipal CustomUserDetails userDetails,
                                  @PathVariable String postId) {
        interactionService.uncollect(userDetails.getUserId(), postId);
        return Result.success();
    }
}
