package com.snipxn.note.dto.req;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateNoteRequest {

    private String folderId;

    @Size(max = 255)
    private String title;
    private String content;
    private String primaryLanguage;
    private Boolean isStarred;
    private List<String> tagIds;
    private String deviceId;
    private Long version;
}
