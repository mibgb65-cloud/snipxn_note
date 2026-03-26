package com.snipxn.ai.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CodeGenerateRequest {

    @NotBlank(message = "需求描述不能为空")
    private String description;

    private String language;
}
