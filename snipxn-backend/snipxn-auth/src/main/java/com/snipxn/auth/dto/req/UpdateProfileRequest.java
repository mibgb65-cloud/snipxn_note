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

    @Size(max = 255, message = "网站链接最多255个字符")
    private String website;

    @Size(max = 100, message = "GitHub 用户名最多100个字符")
    private String github;

    @Size(max = 100, message = "所在地最多100个字符")
    private String location;

    @Size(max = 100, message = "公司/学校最多100个字符")
    private String company;

    @Size(max = 500, message = "技术栈最多500个字符")
    private String techStack;
}
