package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "ResetPasswordRequest", description = "通过邮箱验证码重置密码的请求")
public class ResetPasswordRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "注册邮箱", example = "alice@example.com")
    private String email;

    @NotBlank(message = "验证码不能为空")
    @Size(min = 6, max = 6, message = "验证码为6位数字")
    @Schema(description = "邮箱验证码", example = "123456")
    private String code;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度8-64位")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "密码必须包含字母和数字")
    @Schema(description = "新密码，需同时包含字母和数字", example = "NewPassw0rd123")
    private String newPassword;
}
