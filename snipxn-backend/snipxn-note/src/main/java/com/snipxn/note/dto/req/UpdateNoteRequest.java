package com.snipxn.note.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
@Schema(name = "UpdateNoteRequest", description = "更新笔记请求")
public class UpdateNoteRequest {

    @Schema(description = "目标文件夹 ID", example = "folder-123")
    private String folderId;

    @Size(max = 255)
    @Schema(description = "笔记标题", example = "JWT 登录实现记录")
    private String title;
    @Schema(description = "笔记正文内容，可包含 Markdown 或代码片段", example = "# 登录流程\\n这里记录实现细节。")
    private String content;
    @Schema(description = "笔记主语言", example = "java")
    private String primaryLanguage;
    @Schema(description = "是否星标", example = "true")
    private Boolean isStarred;
    @Schema(description = "标签 ID 列表", example = "[\"tag-1\", \"tag-2\"]")
    private List<String> tagIds;
    @Schema(description = "当前编辑设备 ID，用于同步冲突处理", example = "web-chrome-a1b2c3")
    private String deviceId;
    @Schema(description = "数据版本号，用于并发更新校验", example = "8")
    private Long version;
}
