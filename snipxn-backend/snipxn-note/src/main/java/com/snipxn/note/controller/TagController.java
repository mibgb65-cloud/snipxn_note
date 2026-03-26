package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.TagRequest;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public Result<List<SyncPullResponse.TagResp>> listTags(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(tagService.listTags(userDetails.getUserId()));
    }

    @PostMapping
    public Result<SyncPullResponse.TagResp> createTag(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TagRequest req) {
        return Result.success(tagService.createTag(userDetails.getUserId(), req.getName(), req.getColor()));
    }

    @PutMapping("/{tagId}")
    public Result<Void> updateTag(@AuthenticationPrincipal CustomUserDetails userDetails,
                                  @PathVariable String tagId,
                                  @Valid @RequestBody TagRequest req) {
        tagService.updateTag(userDetails.getUserId(), tagId, req.getName(), req.getColor());
        return Result.success();
    }

    @DeleteMapping("/{tagId}")
    public Result<Void> deleteTag(@AuthenticationPrincipal CustomUserDetails userDetails,
                                  @PathVariable String tagId) {
        tagService.deleteTag(userDetails.getUserId(), tagId);
        return Result.success();
    }
}
