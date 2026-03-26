package com.snipxn.community.controller;

import com.snipxn.common.result.Result;
import com.snipxn.community.dto.resp.PublicPostResponse;
import com.snipxn.community.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/posts")
@RequiredArgsConstructor
public class PublicPostController {

    private final PostService postService;

    @GetMapping("/{shareToken}")
    public Result<PublicPostResponse> getPublicPost(@PathVariable String shareToken) {
        return Result.success(postService.getPublicPost(shareToken));
    }
}
