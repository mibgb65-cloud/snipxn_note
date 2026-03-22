package com.snipxn.sandbox.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RunCodeRequest {

    @NotBlank(message = "语言不能为空")
    private String language;

    @NotBlank(message = "源代码不能为空")
    private String sourceCode;

    private String stdin;
}
