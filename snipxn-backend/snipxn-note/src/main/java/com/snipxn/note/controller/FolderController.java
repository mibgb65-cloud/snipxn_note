package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.CreateFolderRequest;
import com.snipxn.note.dto.req.UpdateFolderRequest;
import com.snipxn.note.dto.resp.FolderResponse;
import com.snipxn.note.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    public Result<List<FolderResponse>> listFolders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(folderService.listFolders(userDetails.getUserId()));
    }

    @PostMapping
    public Result<FolderResponse> createFolder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                               @Valid @RequestBody CreateFolderRequest req) {
        return Result.success(folderService.createFolder(userDetails.getUserId(), req));
    }

    @PutMapping("/{folderId}")
    public Result<Void> updateFolder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                     @PathVariable String folderId,
                                     @Valid @RequestBody UpdateFolderRequest req) {
        folderService.updateFolder(userDetails.getUserId(), folderId, req);
        return Result.success();
    }

    @DeleteMapping("/{folderId}")
    public Result<Void> deleteFolder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                     @PathVariable String folderId) {
        folderService.deleteFolder(userDetails.getUserId(), folderId);
        return Result.success();
    }
}
