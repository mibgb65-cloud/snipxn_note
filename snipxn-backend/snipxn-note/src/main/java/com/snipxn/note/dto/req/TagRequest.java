package com.snipxn.note.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TagRequest {

    @NotBlank
    private String name;
    private String color;
}
