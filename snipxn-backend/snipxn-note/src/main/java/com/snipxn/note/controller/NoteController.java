package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.CreateNoteRequest;
import com.snipxn.note.dto.req.UpdateNoteRequest;
import com.snipxn.note.dto.resp.NoteDetailResponse;
import com.snipxn.note.dto.resp.NoteListItemResponse;
import com.snipxn.note.dto.resp.ShareNoteResponse;
import com.snipxn.note.dto.resp.StorageBreakdownResponse;
import com.snipxn.note.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
@Tag(name = "笔记", description = "笔记列表、详情、编辑、回收站、分享与导入接口")
@SecurityRequirement(name = "Bearer Token")
public class NoteController {

    private final NoteService noteService;

    @Operation(summary = "获取笔记列表", description = "可按文件夹筛选，返回当前用户可见的分页笔记数据")
    @GetMapping
    public Result<PageResult<NoteListItemResponse>> listNotes(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "文件夹 ID；不传表示全部笔记") @RequestParam(required = false) String folderId,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listNotes(userDetails.getUserId(), folderId, page, size)));
    }

    @Operation(summary = "获取星标笔记列表")
    @GetMapping("/starred")
    public Result<PageResult<NoteListItemResponse>> listStarred(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listStarred(userDetails.getUserId(), page, size)));
    }

    @Operation(summary = "获取回收站笔记列表")
    @GetMapping("/trash")
    public Result<PageResult<NoteListItemResponse>> listTrash(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listTrash(userDetails.getUserId(), page, size)));
    }

    @Operation(summary = "获取笔记详情")
    @GetMapping("/{noteId}")
    public Result<NoteDetailResponse> getNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                              @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        return Result.success(noteService.getNote(userDetails.getUserId(), noteId));
    }

    @Operation(summary = "创建笔记")
    @PostMapping
    public Result<NoteDetailResponse> createNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @Valid @RequestBody CreateNoteRequest req) {
        return Result.success(noteService.createNote(userDetails.getUserId(), req));
    }

    @Operation(summary = "更新笔记", description = "更新时建议携带最新 version，避免多端同步覆盖")
    @PutMapping("/{noteId}")
    public Result<Void> updateNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Parameter(description = "笔记 ID") @PathVariable String noteId,
                                   @Valid @RequestBody UpdateNoteRequest req) {
        noteService.updateNote(userDetails.getUserId(), noteId, req);
        return Result.success();
    }

    @Operation(summary = "删除笔记", description = "逻辑删除到回收站")
    @DeleteMapping("/{noteId}")
    public Result<Void> deleteNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        noteService.deleteNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @Operation(summary = "从回收站恢复笔记")
    @PostMapping("/{noteId}/restore")
    public Result<Void> restoreNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                    @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        noteService.restoreNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @Operation(summary = "永久删除笔记", description = "永久删除后无法恢复")
    @DeleteMapping("/{noteId}/permanent")
    public Result<Void> permanentDeleteNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                            @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        noteService.permanentDeleteNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @Operation(summary = "查询笔记分享状态")
    @GetMapping("/{noteId}/share")
    public Result<ShareNoteResponse> checkShareStatus(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                                      @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        return Result.success(noteService.checkShareStatus(userDetails.getUserId(), noteId));
    }

    @Operation(summary = "创建或刷新笔记分享链接")
    @PostMapping("/{noteId}/share")
    public Result<ShareNoteResponse> shareNote(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                               @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        return Result.success(noteService.shareNote(userDetails.getUserId(), noteId));
    }

    @Operation(summary = "取消笔记分享")
    @DeleteMapping("/{noteId}/share")
    public Result<Void> cancelShare(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                    @Parameter(description = "笔记 ID") @PathVariable String noteId) {
        noteService.cancelShare(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @Operation(summary = "获取存储占用明细")
    @GetMapping("/storage-breakdown")
    public Result<StorageBreakdownResponse> getStorageBreakdown(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(noteService.getStorageBreakdown(userDetails.getUserId()));
    }

    @Operation(summary = "批量导入笔记", description = "支持上传多个文件导入为笔记，可指定目标文件夹")
    @PostMapping("/import")
    public Result<List<NoteDetailResponse>> importNotes(
            @Parameter(description = "需要导入的文件列表") @RequestParam("files") List<MultipartFile> files,
            @Parameter(description = "目标文件夹 ID；不传则由服务端按默认策略处理")
            @RequestParam(value = "folderId", required = false) String folderId,
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(noteService.importNotes(userDetails.getUserId(), files, folderId));
    }
}
