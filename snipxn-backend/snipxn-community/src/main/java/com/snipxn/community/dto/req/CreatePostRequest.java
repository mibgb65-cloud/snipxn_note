package com.snipxn.community.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreatePostRequest {

    private String originNoteId;

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String language;
    private List<String> tags;
}
