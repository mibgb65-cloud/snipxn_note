package com.snipxn.auth.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
@Schema(name = "UpdateProfileRequest", description = "更新个人资料请求")
public class UpdateProfileRequest {

    @Size(max = 50, message = "昵称最多50个字符")
    @Schema(description = "用户昵称", example = "Alice")
    private String nickname;

    @Schema(description = "头像文件访问地址", example = "/api/v1/files/avatar-file-id")
    private String avatar;

    @Size(max = 200, message = "简介最多200个字符")
    @Schema(description = "个人简介", example = "专注于代码笔记与开发效率")
    private String bio;

    /** 0-未知 1-男 2-女 */
    @Schema(description = "性别：0 未知，1 男，2 女", example = "0")
    private Short gender;

    @Schema(description = "生日", example = "2000-01-01")
    private LocalDate birthday;

    @Size(max = 255, message = "网站链接最多255个字符")
    @Schema(description = "个人网站链接", example = "https://example.com")
    private String website;

    @Size(max = 100, message = "GitHub 用户名最多100个字符")
    @Schema(description = "GitHub 用户名", example = "alice-dev")
    private String github;

    @Size(max = 100, message = "所在地最多100个字符")
    @Schema(description = "所在地", example = "Shanghai")
    private String location;

    @Size(max = 100, message = "公司/学校最多100个字符")
    @Schema(description = "公司或学校", example = "Snipxn Lab")
    private String company;

    @Size(max = 500, message = "技术栈最多500个字符")
    @Schema(description = "技术栈描述", example = "Java, Spring Boot, Vue, PostgreSQL")
    private String techStack;
}
