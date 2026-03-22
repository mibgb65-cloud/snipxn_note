package com.snipxn.note.dto.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateFolderRequest {

    @Size(max = 100)
    private String name;
    private String icon;
    private String rankIndex;

    @NotNull
    private Long version;
}
