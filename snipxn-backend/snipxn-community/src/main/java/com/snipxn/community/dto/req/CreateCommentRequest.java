package com.snipxn.community.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "CreateCommentRequest", description = "创建评论或回复请求")
public class CreateCommentRequest {

    @NotBlank
    @Size(max = 2000)
    @Schema(description = "评论内容", example = "这段实现思路很清晰，感谢分享。")
    private String content;

    @Schema(description = "父评论 ID；为空表示一级评论，不为空表示回复该评论", example = "comment-123")
    private String parentId;
}
