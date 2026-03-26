package com.snipxn.ai.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CodeReviewRequest {

    @NotBlank(message = "代码不能为空")
    private String code;

    @NotBlank(message = "错误信息不能为空")
    private String errorMessage;

    private String language;
}
