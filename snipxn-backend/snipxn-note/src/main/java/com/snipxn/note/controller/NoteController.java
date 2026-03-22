package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.PageResult;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.CreateNoteRequest;
import com.snipxn.note.dto.req.UpdateNoteRequest;
import com.snipxn.note.dto.resp.NoteDetailResponse;
import com.snipxn.note.dto.resp.NoteListItemResponse;
import com.snipxn.note.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public Result<PageResult<NoteListItemResponse>> listNotes(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String folderId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listNotes(userDetails.getUserId(), folderId, page, size)));
    }

    @GetMapping("/starred")
    public Result<PageResult<NoteListItemResponse>> listStarred(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listStarred(userDetails.getUserId(), page, size)));
    }

    @GetMapping("/trash")
    public Result<PageResult<NoteListItemResponse>> listTrash(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(PageResult.of(noteService.listTrash(userDetails.getUserId(), page, size)));
    }

    @GetMapping("/{noteId}")
    public Result<NoteDetailResponse> getNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                              @PathVariable String noteId) {
        return Result.success(noteService.getNote(userDetails.getUserId(), noteId));
    }

    @PostMapping
    public Result<NoteDetailResponse> createNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @Valid @RequestBody CreateNoteRequest req) {
        return Result.success(noteService.createNote(userDetails.getUserId(), req));
    }

    @PutMapping("/{noteId}")
    public Result<Void> updateNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                   @PathVariable String noteId,
                                   @Valid @RequestBody UpdateNoteRequest req) {
        noteService.updateNote(userDetails.getUserId(), noteId, req);
        return Result.success();
    }

    @DeleteMapping("/{noteId}")
    public Result<Void> deleteNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                   @PathVariable String noteId) {
        noteService.deleteNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @PostMapping("/{noteId}/restore")
    public Result<Void> restoreNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                    @PathVariable String noteId) {
        noteService.restoreNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @DeleteMapping("/{noteId}/permanent")
    public Result<Void> permanentDeleteNote(@AuthenticationPrincipal CustomUserDetails userDetails,
                                            @PathVariable String noteId) {
        noteService.permanentDeleteNote(userDetails.getUserId(), noteId);
        return Result.success();
    }

    @PostMapping("/import")
    public Result<List<NoteDetailResponse>> importNotes(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folderId", required = false) String folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(noteService.importNotes(userDetails.getUserId(), files, folderId));
    }
}
