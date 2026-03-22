package com.snipxn.auth.dto.req;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileRequest {

    @Size(max = 50, message = "昵称最多50个字符")
    private String nickname;

    private String avatar;

    @Size(max = 200, message = "简介最多200个字符")
    private String bio;

    /** 0-未知 1-男 2-女 */
    private Short gender;

    private LocalDate birthday;
}
