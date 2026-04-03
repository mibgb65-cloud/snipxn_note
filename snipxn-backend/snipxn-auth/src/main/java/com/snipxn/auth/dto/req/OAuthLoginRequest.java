package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "OAuthLoginRequest", description = "第三方 OAuth 登录请求")
public class OAuthLoginRequest {

    @NotBlank(message = "授权码不能为空")
    @Schema(description = "OAuth 授权码", example = "4/0AdQt8qh-example-code")
    private String code;

    @NotBlank(message = "设备ID不能为空")
    @Schema(description = "客户端设备 ID，用于区分登录设备", example = "web-chrome-a1b2c3")
    private String deviceId;

    @Schema(description = "设备名称，便于设备管理页展示", example = "Chrome on Windows")
    private String deviceName;

    /** Google OAuth 需要 redirect_uri 匹配 */
    @Schema(description = "OAuth 回调地址；Google 登录时需与平台配置保持一致", example = "http://localhost:5173/oauth/callback")
    private String redirectUri;
}
