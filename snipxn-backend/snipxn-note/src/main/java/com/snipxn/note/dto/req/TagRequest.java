package com.snipxn.note.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "TagRequest", description = "创建或更新标签请求")
public class TagRequest {

    @NotBlank
    @Schema(description = "标签名称", example = "Spring Boot")
    private String name;
    @Schema(description = "标签颜色，建议使用十六进制颜色值", example = "#4F46E5")
    private String color;
}
