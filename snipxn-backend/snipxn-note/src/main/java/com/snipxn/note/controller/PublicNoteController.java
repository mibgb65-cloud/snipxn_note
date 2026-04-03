package com.snipxn.note.controller;

import com.snipxn.common.result.Result;
import com.snipxn.note.dto.resp.PublicNoteResponse;
import com.snipxn.note.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/notes")
@RequiredArgsConstructor
@Tag(name = "公开分享", description = "匿名访问公开分享的笔记与帖子")
public class PublicNoteController {

    private final NoteService noteService;

    @Operation(summary = "获取公开分享笔记")
    @GetMapping("/{shareToken}")
    public Result<PublicNoteResponse> getPublicNote(@Parameter(description = "笔记分享令牌") @PathVariable String shareToken) {
        return Result.success(noteService.getPublicNote(shareToken));
    }
}
