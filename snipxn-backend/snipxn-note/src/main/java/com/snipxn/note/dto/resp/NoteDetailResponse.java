package com.snipxn.note.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class NoteDetailResponse {

    private String id;
    private String folderId;
    private String title;
    private String content;
    private String summary;
    private String primaryLanguage;
    private Boolean isStarred;
    private String status;
    private List<String> tagIds;
    private Long version;
    private String lastDeviceId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
