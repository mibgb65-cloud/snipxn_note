package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "LoginRequest", description = "邮箱密码登录请求")
public class LoginRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "登录邮箱", example = "alice@example.com")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Schema(description = "登录密码", example = "Passw0rd123")
    private String password;

    @NotBlank(message = "设备ID不能为空")
    @Schema(description = "客户端设备 ID，用于区分登录设备", example = "web-chrome-a1b2c3")
    private String deviceId;

    @Schema(description = "设备名称，便于设备管理页展示", example = "Chrome on Windows")
    private String deviceName;
}
