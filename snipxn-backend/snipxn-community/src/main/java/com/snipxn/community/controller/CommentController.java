package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.req.CreateCommentRequest;
import com.snipxn.community.dto.resp.CommentResponse;
import com.snipxn.community.service.CommentService;
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
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public Result<PageResult<CommentResponse>> listTopLevelComments(
            @PathVariable String postId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(commentService.listTopLevelComments(postId, currentUserId, page, size));
    }

    @GetMapping("/{commentId}/replies")
    public Result<PageResult<CommentResponse>> listReplies(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        String currentUserId = userDetails != null ? userDetails.getUserId() : null;
        return Result.success(commentService.listReplies(commentId, currentUserId, page, size));
    }

    @PostMapping
    public Result<CommentResponse> createComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String postId,
            @Valid @RequestBody CreateCommentRequest req) {
        return Result.success(commentService.createComment(userDetails.getUserId(), postId, req));
    }

    @DeleteMapping("/{commentId}")
    public Result<Void> deleteComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String postId,
            @PathVariable String commentId) {
        commentService.deleteComment(userDetails.getUserId(), commentId);
        return Result.success();
    }

    @PostMapping("/{commentId}/like")
    public Result<Void> likeComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String postId,
            @PathVariable String commentId) {
        commentService.likeComment(userDetails.getUserId(), commentId);
        return Result.success();
    }

    @DeleteMapping("/{commentId}/like")
    public Result<Void> unlikeComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String postId,
            @PathVariable String commentId) {
        commentService.unlikeComment(userDetails.getUserId(), commentId);
        return Result.success();
    }
}
