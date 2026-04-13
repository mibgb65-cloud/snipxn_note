package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "GoogleMobileLoginRequest", description = "移动端 Google 登录请求（直接传递用户信息）")
public class GoogleMobileLoginRequest {

    @NotBlank(message = "Google ID 不能为空")
    @Schema(description = "Google 用户 ID", example = "109876543210")
    private String googleId;

    @Schema(description = "Google 邮箱")
    private String email;

    @Schema(description = "Google 显示名")
    private String name;

    @Schema(description = "Google 头像 URL")
    private String avatar;

    @NotBlank(message = "设备ID不能为空")
    @Schema(description = "客户端设备 ID", example = "android-a1b2c3")
    private String deviceId;

    @Schema(description = "设备名称", example = "Pixel 9")
    private String deviceName;
}
