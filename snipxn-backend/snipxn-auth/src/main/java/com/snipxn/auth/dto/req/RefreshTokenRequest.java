package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "RefreshTokenRequest", description = "刷新令牌请求")
public class RefreshTokenRequest {

    @NotBlank(message = "refreshToken不能为空")
    @Schema(description = "登录后获得的 refreshToken", example = "eyJhbGciOiJIUzI1NiJ9.refresh")
    private String refreshToken;

    @NotBlank(message = "设备ID不能为空")
    @Schema(description = "当前客户端设备 ID", example = "web-chrome-a1b2c3")
    private String deviceId;
}
