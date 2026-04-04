package com.snipxn.version.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snipxn.version.dto.resp.AppVersionResponse;
import com.snipxn.version.entity.AppVersion;
import com.snipxn.version.mapper.AppVersionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/app/version")
@RequiredArgsConstructor
@Tag(name = "应用版本", description = "客户端版本检查（公开接口）")
public class AppVersionController {

    private final AppVersionMapper appVersionMapper;

    @Operation(summary = "获取指定平台的最新版本")
    @GetMapping("/latest")
    public ResponseEntity<AppVersionResponse> getLatestVersion(
            @Parameter(description = "平台：ANDROID 或 IOS") @RequestParam String platform) {

        AppVersion latest = appVersionMapper.selectOne(
                new LambdaQueryWrapper<AppVersion>()
                        .eq(AppVersion::getPlatform, platform.toUpperCase())
                        .orderByDesc(AppVersion::getPublishedAt)
                        .last("LIMIT 1"));

        if (latest == null) {
            return ResponseEntity.noContent().build();
        }

        AppVersionResponse response = new AppVersionResponse();
        response.setVersion(latest.getVersion());
        response.setBuildNumber(latest.getBuildNumber());
        response.setUpdateUrl(latest.getUpdateUrl());
        response.setReleaseNotes(latest.getReleaseNotes());
        response.setPublishedAt(latest.getPublishedAt());

        return ResponseEntity.ok(response);
    }
}
