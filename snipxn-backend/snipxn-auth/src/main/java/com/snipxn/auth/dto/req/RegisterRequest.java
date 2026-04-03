package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "RegisterRequest", description = "邮箱注册请求")
public class RegisterRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "注册邮箱", example = "alice@example.com")
    private String email;

    @NotBlank(message = "验证码不能为空")
    @Size(min = 6, max = 6, message = "验证码为6位数字")
    @Schema(description = "邮箱验证码", example = "123456")
    private String code;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度8-64位")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "密码必须包含字母和数字")
    @Schema(description = "登录密码，需同时包含字母和数字", example = "Passw0rd123")
    private String password;

    @NotBlank(message = "设备ID不能为空")
    @Schema(description = "客户端设备 ID，用于区分登录设备", example = "web-chrome-a1b2c3")
    private String deviceId;

    @Schema(description = "设备名称，便于设备管理页展示", example = "Chrome on Windows")
    private String deviceName;
}
