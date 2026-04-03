package com.snipxn.community.controller;

import com.snipxn.common.result.Result;
import com.snipxn.community.dto.resp.PublicPostResponse;
import com.snipxn.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/posts")
@RequiredArgsConstructor
@Tag(name = "公开分享", description = "匿名访问公开分享的笔记与帖子")
public class PublicPostController {

    private final PostService postService;

    @Operation(summary = "获取公开分享帖子")
    @GetMapping("/{shareToken}")
    public Result<PublicPostResponse> getPublicPost(@Parameter(description = "帖子分享令牌") @PathVariable String shareToken) {
        return Result.success(postService.getPublicPost(shareToken));
    }
}
