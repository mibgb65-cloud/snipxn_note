package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(name = "SendCodeRequest", description = "发送邮箱验证码请求")
public class SendCodeRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "接收验证码的邮箱地址", example = "alice@example.com")
    private String email;

    /** 验证码场景：REGISTER / RESET_PASSWORD */
    @NotBlank(message = "场景不能为空")
    @Pattern(regexp = "REGISTER|RESET_PASSWORD", message = "场景只能为 REGISTER 或 RESET_PASSWORD")
    @Schema(description = "验证码场景", allowableValues = {"REGISTER", "RESET_PASSWORD"}, example = "REGISTER")
    private String scene;
}
