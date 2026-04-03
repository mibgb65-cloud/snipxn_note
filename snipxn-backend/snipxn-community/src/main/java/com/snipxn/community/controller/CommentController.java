package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.req.CreateCommentRequest;
import com.snipxn.community.dto.resp.CommentResponse;
import com.snipxn.community.service.CommentService;
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
@RequestMapping("/api/v1/posts/{postId}/comments")
@RequiredArgsConstructor
@Tag(name = "评论", description = "帖子评论、回复与评论点赞接口")
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "获取一级评论列表")
    @GetMapping
    public Result<PageResult<CommentResponse>> listTopLevelComments(
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(commentService.listTopLevelComments(postId, currentUserId, page, size));
    }

    @Operation(summary = "获取评论回复列表")
    @GetMapping("/{commentId}/replies")
    public Result<PageResult<CommentResponse>> listReplies(
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(description = "父评论 ID") @PathVariable String commentId,
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(commentService.listReplies(commentId, currentUserId, page, size));
    }

    @Operation(summary = "发表评论或回复评论")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping
    public Result<CommentResponse> createComment(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Valid @RequestBody CreateCommentRequest req) {
        return Result.success(commentService.createComment(userDetails.getUserId(), postId, req));
    }

    @Operation(summary = "删除评论")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{commentId}")
    public Result<Void> deleteComment(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(description = "评论 ID") @PathVariable String commentId) {
        commentService.deleteComment(userDetails.getUserId(), commentId);
        return Result.success();
    }

    @Operation(summary = "点赞评论")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/{commentId}/like")
    public Result<Void> likeComment(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(description = "评论 ID") @PathVariable String commentId) {
        commentService.likeComment(userDetails.getUserId(), commentId);
        return Result.success();
    }

    @Operation(summary = "取消点赞评论")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{commentId}/like")
    public Result<Void> unlikeComment(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "帖子 ID") @PathVariable String postId,
            @Parameter(description = "评论 ID") @PathVariable String commentId) {
        commentService.unlikeComment(userDetails.getUserId(), commentId);
        return Result.success();
    }
}
