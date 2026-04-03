package com.snipxn.sandbox.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "RunCodeRequest", description = "在线运行代码请求")
public class RunCodeRequest {

    @NotBlank(message = "语言不能为空")
    @Schema(description = "编程语言标识", example = "java")
    private String language;

    @NotBlank(message = "源代码不能为空")
    @Schema(description = "待运行的源代码", example = "public class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }")
    private String sourceCode;

    @Schema(description = "标准输入内容", example = "1 2 3")
    private String stdin;
}
