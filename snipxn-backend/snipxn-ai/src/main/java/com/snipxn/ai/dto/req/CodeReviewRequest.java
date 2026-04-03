package com.snipxn.ai.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "CodeReviewRequest", description = "AI 代码审查请求")
public class CodeReviewRequest {

    @NotBlank(message = "代码不能为空")
    @Schema(description = "待审查的代码", example = "public class Demo { }")
    private String code;

    @NotBlank(message = "错误信息不能为空")
    @Schema(description = "运行报错或希望 AI 重点关注的问题描述", example = "NullPointerException at line 12")
    private String errorMessage;

    @Schema(description = "代码所属语言", example = "java")
    private String language;
}
