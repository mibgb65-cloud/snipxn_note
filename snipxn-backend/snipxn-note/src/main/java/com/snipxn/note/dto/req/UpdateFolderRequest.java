package com.snipxn.note.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "UpdateFolderRequest", description = "更新文件夹请求")
public class UpdateFolderRequest {

    @Size(max = 100)
    @Schema(description = "文件夹名称", example = "后端开发")
    private String name;
    @Schema(description = "文件夹图标标识", example = "pi pi-folder-open")
    private String icon;
    @Schema(description = "排序索引，用于自定义拖拽排序", example = "a1")
    private String rankIndex;

    @NotNull
    @Schema(description = "数据版本号，用于并发更新校验", example = "3")
    private Long version;
}
