package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.req.SyncPushRequest;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @GetMapping("/pull")
    public Result<SyncPullResponse> pull(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime lastPulledAt) {
        return Result.success(syncService.pull(userDetails.getUserId(), lastPulledAt));
    }

    @PostMapping("/push")
    public Result<SyncPullResponse> push(@AuthenticationPrincipal CustomUserDetails userDetails,
                                         @RequestBody SyncPushRequest req) {
        return Result.success(syncService.push(userDetails.getUserId(), req));
    }
}
