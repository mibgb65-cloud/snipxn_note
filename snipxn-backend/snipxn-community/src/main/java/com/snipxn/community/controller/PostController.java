package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.req.CreatePostRequest;
import com.snipxn.community.dto.resp.PostDetailResponse;
import com.snipxn.community.dto.resp.PostListItemResponse;
import com.snipxn.community.dto.resp.SharePostResponse;
import com.snipxn.community.service.InteractionService;
import com.snipxn.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "帖子", description = "社区帖子浏览、发布、点赞、收藏与分享接口")
public class PostController {

    private final PostService postService;
    private final InteractionService interactionService;

    @Operation(summary = "获取帖子列表")
    @GetMapping
    public Result<PageResult<PostListItemResponse>> listPosts(
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(postService.listPosts(page, size));
    }

    @Operation(summary = "获取指定用户发布的帖子列表")
    @GetMapping("/user/{userId}")
    public Result<PageResult<PostListItemResponse>> listUserPosts(
            @Parameter(description = "用户 ID") @PathVariable String userId,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(postService.listUserPosts(userId, page, size));
    }

    @Operation(summary = "获取热门帖子列表")
    @GetMapping("/hot")
    public Result<PageResult<PostListItemResponse>> listHotPosts(
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(postService.listHotPosts(page, size));
    }

    @Operation(summary = "获取帖子详情", description = "已登录访问时可额外返回当前用户维度的点赞和收藏状态")
    @GetMapping("/{postId}")
    public Result<PostDetailResponse> getPost(
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(postService.getPost(postId, currentUserId));
    }

    @Operation(summary = "发布帖子")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping
    public Result<PostDetailResponse> createPost(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePostRequest req) {
        return Result.success(postService.createPost(userDetails.getUserId(), req));
    }

    @Operation(summary = "删除帖子")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{postId}")
    public Result<Void> deletePost(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId) {
        postService.deletePost(userDetails.getUserId(), postId);
        return Result.success();
    }

    @Operation(summary = "创建或刷新帖子分享链接")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/{postId}/share")
    public Result<SharePostResponse> share(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId) {
        return Result.success(postService.sharePost(userDetails.getUserId(), postId));
    }

    @Operation(summary = "查询帖子分享状态")
    @SecurityRequirement(name = "Bearer Token")
    @GetMapping("/{postId}/share")
    public Result<SharePostResponse> checkShare(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId) {
        return Result.success(postService.checkShareStatus(userDetails.getUserId(), postId));
    }

    @Operation(summary = "取消帖子分享")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{postId}/share")
    public Result<Void> cancelShare(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId) {
        postService.cancelShare(userDetails.getUserId(), postId);
        return Result.success();
    }

    @Operation(summary = "点赞帖子")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/{postId}/like")
    public Result<Void> like(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                             @Parameter(description = "帖子 ID") @PathVariable String postId) {
        interactionService.like(userDetails.getUserId(), postId);
        return Result.success();
    }

    @Operation(summary = "取消点赞帖子")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{postId}/like")
    public Result<Void> unlike(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                               @Parameter(description = "帖子 ID") @PathVariable String postId) {
        interactionService.unlike(userDetails.getUserId(), postId);
        return Result.success();
    }

    @Operation(summary = "收藏帖子")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/{postId}/collect")
    public Result<Void> collect(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                @Parameter(description = "帖子 ID") @PathVariable String postId) {
        interactionService.collect(userDetails.getUserId(), postId);
        return Result.success();
    }

    @Operation(summary = "取消收藏帖子")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{postId}/collect")
    public Result<Void> uncollect(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                  @Parameter(description = "帖子 ID") @PathVariable String postId) {
        interactionService.uncollect(userDetails.getUserId(), postId);
        return Result.success();
    }
}
