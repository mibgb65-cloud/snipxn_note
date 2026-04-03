package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.SyncPushRequest;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.service.SyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@Tag(name = "同步", description = "多端笔记、文件夹、标签的增量同步接口")
@SecurityRequirement(name = "Bearer Token")
public class SyncController {

    private final SyncService syncService;

    @Operation(summary = "拉取增量同步数据", description = "按 lastPulledAt 获取服务端自上次同步后的变更")
    @GetMapping("/pull")
    public Result<SyncPullResponse> pull(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "上次成功拉取时间，ISO-8601 格式；不传表示全量首拉")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime lastPulledAt) {
        return Result.success(syncService.pull(userDetails.getUserId(), lastPulledAt));
    }

    @Operation(summary = "提交本地变更并获取最新同步结果", description = "上报客户端变更后，返回合并后的最新数据")
    @PostMapping("/push")
    public Result<SyncPullResponse> push(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                         @RequestBody SyncPushRequest req) {
        return Result.success(syncService.push(userDetails.getUserId(), req));
    }
}
