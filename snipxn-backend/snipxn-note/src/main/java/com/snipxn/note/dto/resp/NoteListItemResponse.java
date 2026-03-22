package com.snipxn.note.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class NoteListItemResponse {

    private String id;
    private String folderId;
    private String title;
    private String summary;
    private String primaryLanguage;
    private Boolean isStarred;
    private List<String> tagIds;
    private Long version;
    private Integer characterCount;
    private Long documentSizeBytes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
