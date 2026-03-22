package com.snipxn.note.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateNoteRequest {

    @NotBlank
    private String folderId;

    @Size(max = 255)
    private String title;
    private String content;
    private String primaryLanguage;
    private List<String> tagIds;
    private String deviceId;
}
