package com.snipxn.auth.dto.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SendCodeRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /** 验证码场景：REGISTER / RESET_PASSWORD */
    @NotBlank(message = "场景不能为空")
    @Pattern(regexp = "REGISTER|RESET_PASSWORD", message = "场景只能为 REGISTER 或 RESET_PASSWORD")
    private String scene;
}
