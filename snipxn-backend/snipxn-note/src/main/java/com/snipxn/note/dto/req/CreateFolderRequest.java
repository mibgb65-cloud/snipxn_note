package com.snipxn.note.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "CreateFolderRequest", description = "创建文件夹请求")
public class CreateFolderRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "文件夹名称", example = "后端开发")
    private String name;
    @Schema(description = "文件夹图标标识", example = "pi pi-folder")
    private String icon;
    @Schema(description = "排序索引，用于自定义拖拽排序", example = "a0")
    private String rankIndex;
}
