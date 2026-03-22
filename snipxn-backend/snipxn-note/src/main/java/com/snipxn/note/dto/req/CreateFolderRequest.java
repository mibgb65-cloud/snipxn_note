package com.snipxn.note.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFolderRequest {

    @NotBlank
    @Size(max = 100)
    private String name;
    private String icon;
    private String rankIndex;
}
