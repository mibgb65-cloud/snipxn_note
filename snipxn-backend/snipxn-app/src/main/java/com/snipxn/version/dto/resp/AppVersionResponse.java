package com.snipxn.version.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Schema(name = "AppVersionResponse", description = "最新应用版本信息")
public class AppVersionResponse {

    @Schema(description = "版本号", example = "1.1.0")
    private String version;

    @Schema(description = "构建号", example = "42")
    private String buildNumber;

    @Schema(description = "下载/商店链接", example = "https://example.com/download")
    private String updateUrl;

    @Schema(description = "更新说明", example = "修复若干问题，优化性能。")
    private String releaseNotes;

    @Schema(description = "发布时间")
    private OffsetDateTime publishedAt;
}
