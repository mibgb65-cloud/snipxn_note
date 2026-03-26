package com.snipxn.community.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCommentRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;

    private String parentId;
}
