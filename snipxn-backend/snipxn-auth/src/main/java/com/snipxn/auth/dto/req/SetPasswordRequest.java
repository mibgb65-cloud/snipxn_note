package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "SetPasswordRequest", description = "设置或修改密码请求")
public class SetPasswordRequest {

    /** 修改密码时需提供旧密码（首次设置可为空） */
    @Schema(description = "旧密码；首次设置密码时可为空", example = "OldPassw0rd123")
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度8-64位")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "密码必须包含字母和数字")
    @Schema(description = "新密码，需同时包含字母和数字", example = "NewPassw0rd123")
    private String newPassword;
}
