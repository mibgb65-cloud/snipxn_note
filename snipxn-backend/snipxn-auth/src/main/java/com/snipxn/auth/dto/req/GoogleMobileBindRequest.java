package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "GoogleMobileBindRequest", description = "移动端 Google 账号绑定请求")
public class GoogleMobileBindRequest {

    @NotBlank(message = "Google ID 不能为空")
    @Schema(description = "Google 用户 ID", example = "109876543210")
    private String googleId;
}
