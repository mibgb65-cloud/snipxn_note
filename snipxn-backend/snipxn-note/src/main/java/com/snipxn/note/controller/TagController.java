package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.TagRequest;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
@Tag(name = "标签", description = "标签列表与标签管理接口")
@SecurityRequirement(name = "Bearer Token")
public class TagController {

    private final TagService tagService;

    @Operation(summary = "获取标签列表")
    @GetMapping
    public Result<List<SyncPullResponse.TagResp>> listTags(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(tagService.listTags(userDetails.getUserId()));
    }

    @Operation(summary = "创建标签")
    @PostMapping
    public Result<SyncPullResponse.TagResp> createTag(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TagRequest req) {
        return Result.success(tagService.createTag(userDetails.getUserId(), req.getName(), req.getColor()));
    }

    @Operation(summary = "更新标签")
    @PutMapping("/{tagId}")
    public Result<Void> updateTag(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                  @Parameter(description = "标签 ID") @PathVariable String tagId,
                                  @Valid @RequestBody TagRequest req) {
        tagService.updateTag(userDetails.getUserId(), tagId, req.getName(), req.getColor());
        return Result.success();
    }

    @Operation(summary = "删除标签")
    @DeleteMapping("/{tagId}")
    public Result<Void> deleteTag(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                  @Parameter(description = "标签 ID") @PathVariable String tagId) {
        tagService.deleteTag(userDetails.getUserId(), tagId);
        return Result.success();
    }
}
