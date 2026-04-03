package com.snipxn.ai.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "CodeGenerateRequest", description = "AI 代码生成请求")
public class CodeGenerateRequest {

    @NotBlank(message = "需求描述不能为空")
    @Schema(description = "代码生成需求描述", example = "用 Java 实现一个支持过期时间的 LRU 缓存")
    private String description;

    @Schema(description = "目标编程语言", example = "java")
    private String language;
}
