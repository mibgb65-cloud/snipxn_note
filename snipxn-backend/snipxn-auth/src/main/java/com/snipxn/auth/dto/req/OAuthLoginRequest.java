package com.snipxn.auth.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthLoginRequest {

    @NotBlank(message = "授权码不能为空")
    private String code;

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;

    private String deviceName;

    /** Google OAuth 需要 redirect_uri 匹配 */
    private String redirectUri;
}
