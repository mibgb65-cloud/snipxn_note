package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.CreateFolderRequest;
import com.snipxn.note.dto.req.UpdateFolderRequest;
import com.snipxn.note.dto.resp.FolderResponse;
import com.snipxn.note.service.FolderService;
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
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
@Tag(name = "文件夹", description = "笔记文件夹的增删改查接口")
@SecurityRequirement(name = "Bearer Token")
public class FolderController {

    private final FolderService folderService;

    @Operation(summary = "获取文件夹列表")
    @GetMapping
    public Result<List<FolderResponse>> listFolders(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(folderService.listFolders(userDetails.getUserId()));
    }

    @Operation(summary = "创建文件夹")
    @PostMapping
    public Result<FolderResponse> createFolder(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                               @Valid @RequestBody CreateFolderRequest req) {
        return Result.success(folderService.createFolder(userDetails.getUserId(), req));
    }

    @Operation(summary = "更新文件夹")
    @PutMapping("/{folderId}")
    public Result<Void> updateFolder(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                     @Parameter(description = "文件夹 ID") @PathVariable String folderId,
                                     @Valid @RequestBody UpdateFolderRequest req) {
        folderService.updateFolder(userDetails.getUserId(), folderId, req);
        return Result.success();
    }

    @Operation(summary = "删除文件夹", description = "删除前请确认文件夹下的笔记迁移或删除策略")
    @DeleteMapping("/{folderId}")
    public Result<Void> deleteFolder(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                     @Parameter(description = "文件夹 ID") @PathVariable String folderId) {
        folderService.deleteFolder(userDetails.getUserId(), folderId);
        return Result.success();
    }
}
