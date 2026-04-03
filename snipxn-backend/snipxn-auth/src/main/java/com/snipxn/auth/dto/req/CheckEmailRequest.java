package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "CheckEmailRequest", description = "邮箱占用检查请求")
public class CheckEmailRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "待检查的邮箱地址", example = "alice@example.com")
    private String email;
}
