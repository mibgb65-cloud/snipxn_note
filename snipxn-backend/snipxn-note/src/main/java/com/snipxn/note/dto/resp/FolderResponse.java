package com.snipxn.note.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class FolderResponse {

    private String id;
    private String name;
    private String icon;
    private Boolean isDefault;
    private String rankIndex;
    private Long version;
    private int noteCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
