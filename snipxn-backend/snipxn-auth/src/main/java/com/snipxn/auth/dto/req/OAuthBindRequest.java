package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "OAuthBindRequest", description = "第三方账号绑定请求")
public class OAuthBindRequest {

    @NotBlank(message = "授权码不能为空")
    @Schema(description = "OAuth 授权码", example = "4/0AdQt8qh-example-code")
    private String code;

    /** Google OAuth 需要 redirect_uri 匹配 */
    @Schema(description = "OAuth 回调地址；Google 绑定时需与平台配置保持一致", example = "http://localhost:5173/oauth/bind/callback")
    private String redirectUri;
}
