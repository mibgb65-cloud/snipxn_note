package com.snipxn.community.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
@Schema(name = "CreatePostRequest", description = "发布帖子请求")
public class CreatePostRequest {

    @Schema(description = "来源笔记 ID；如果帖子由笔记分享生成可传入", example = "note-123")
    private String originNoteId;

    @NotBlank
    @Schema(description = "帖子标题", example = "用 Spring Boot 做 JWT 登录的完整流程")
    private String title;

    @NotBlank
    @Schema(description = "帖子正文内容", example = "这里分享一下完整的实现思路和踩坑记录。")
    private String content;

    @Schema(description = "代码主语言或内容所属语言", example = "java")
    private String language;
    @Schema(description = "帖子标签列表", example = "[\"Spring Boot\", \"JWT\"]")
    private List<String> tags;
}
