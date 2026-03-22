package com.snipxn.auth.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {

    @NotBlank(message = "refreshToken不能为空")
    private String refreshToken;

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;
}
