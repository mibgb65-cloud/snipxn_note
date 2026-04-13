package com.snipxn.auth.controller;

import com.snipxn.auth.dto.req.GoogleMobileBindRequest;
import com.snipxn.auth.dto.req.OAuthBindRequest;
import com.snipxn.auth.dto.req.SetPasswordRequest;
import com.snipxn.auth.dto.req.UpdateProfileRequest;
import com.snipxn.auth.dto.resp.DeviceResponse;
import com.snipxn.auth.dto.resp.LinkedAccountResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;
import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.auth.service.OAuthService;
import com.snipxn.auth.service.UserService;
import com.snipxn.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@Tag(name = "用户", description = "当前用户资料、密码、设备管理与账号绑定接口")
@SecurityRequirement(name = "Bearer Token")
public class UserController {

    private final UserService userService;
    private final OAuthService oAuthService;

    /** 获取当前用户信息 */
    @Operation(summary = "获取当前用户资料")
    @GetMapping("/me")
    public Result<UserInfoResponse> getMe(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userService.getMe(userDetails.getUserId()));
    }

    /** 更新个人资料 */
    @Operation(summary = "更新个人资料", description = "支持更新昵称、头像、简介、生日、技术栈等资料字段")
    @PutMapping("/me")
    public Result<Void> updateProfile(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                      @Valid @RequestBody UpdateProfileRequest req) {
        userService.updateProfile(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 修改/设置密码 */
    @Operation(summary = "设置或修改密码", description = "首次设置密码时 oldPassword 可为空；已设置过密码时需提供旧密码")
    @PutMapping("/me/password")
    public Result<Void> setPassword(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                    @Valid @RequestBody SetPasswordRequest req) {
        userService.setPassword(userDetails.getUserId(), userDetails.getDeviceId(), req);
        return Result.success();
    }

    /** 获取所有登录设备 */
    @Operation(summary = "获取当前账号的登录设备列表")
    @GetMapping("/me/devices")
    public Result<List<DeviceResponse>> listDevices(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userService.listDevices(userDetails.getUserId()));
    }

    /** 踢下线指定设备 */
    @Operation(summary = "踢下线指定设备")
    @DeleteMapping("/me/devices/{deviceId}")
    public Result<Void> revokeDevice(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                     @Parameter(description = "需要下线的设备 ID") @PathVariable String deviceId) {
        userService.revokeDevice(userDetails.getUserId(), deviceId);
        return Result.success();
    }

    /** 一键踢出所有其他设备 */
    @Operation(summary = "踢下线所有其他设备", description = "保留当前设备登录态，其余设备全部失效")
    @DeleteMapping("/me/devices")
    public Result<Void> revokeAllOtherDevices(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.revokeAllOtherDevices(userDetails.getUserId(), userDetails.getDeviceId());
        return Result.success();
    }

    // ── 绑定认证方式 ──────────────────────────────────────────

    /** 查询当前用户绑定的所有认证方式 */
    @Operation(summary = "获取已绑定的第三方账号")
    @GetMapping("/me/linked-accounts")
    public Result<List<LinkedAccountResponse>> listLinkedAccounts(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(oAuthService.listLinkedAccounts(userDetails.getUserId()));
    }

    /** 绑定 GitHub 账号 */
    @Operation(summary = "绑定 GitHub 账号", description = "使用前端获取的 GitHub 授权码绑定当前登录账号")
    @PostMapping("/me/linked-accounts/github")
    public Result<Void> bindGitHub(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Valid @RequestBody OAuthBindRequest req) {
        oAuthService.bindGitHub(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 绑定 Google 账号 */
    @Operation(summary = "绑定 Google 账号", description = "Google 绑定时 redirectUri 需与 OAuth 配置一致")
    @PostMapping("/me/linked-accounts/google")
    public Result<Void> bindGoogle(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Valid @RequestBody OAuthBindRequest req) {
        oAuthService.bindGoogle(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 移动端绑定 Google 账号 */
    @Operation(summary = "移动端绑定 Google 账号", description = "移动端直接传递 Google 用户 ID 完成绑定")
    @PostMapping("/me/linked-accounts/google/mobile")
    public Result<Void> bindGoogleMobile(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                          @Valid @RequestBody GoogleMobileBindRequest req) {
        oAuthService.bindGoogleMobile(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 解绑认证方式 */
    @Operation(summary = "解绑第三方账号")
    @DeleteMapping("/me/linked-accounts/{identityType}")
    public Result<Void> unbindAccount(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                      @Parameter(description = "认证方式标识，如 GITHUB 或 GOOGLE", example = "GITHUB")
                                      @PathVariable String identityType) {
        oAuthService.unbind(userDetails.getUserId(), identityType.toUpperCase());
        return Result.success();
    }
}
