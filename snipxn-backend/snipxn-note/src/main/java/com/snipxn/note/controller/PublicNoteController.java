package com.snipxn.note.controller;

import com.snipxn.common.result.Result;
import com.snipxn.note.dto.resp.PublicNoteResponse;
import com.snipxn.note.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/notes")
@RequiredArgsConstructor
public class PublicNoteController {

    private final NoteService noteService;

    @GetMapping("/{shareToken}")
    public Result<PublicNoteResponse> getPublicNote(@PathVariable String shareToken) {
        return Result.success(noteService.getPublicNote(shareToken));
    }
}
