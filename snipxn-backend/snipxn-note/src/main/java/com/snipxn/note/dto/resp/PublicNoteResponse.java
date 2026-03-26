package com.snipxn.note.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class PublicNoteResponse {
    private String title;
    private String content;
    private String primaryLanguage;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
