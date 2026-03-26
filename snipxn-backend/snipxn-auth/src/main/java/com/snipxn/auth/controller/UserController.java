package com.snipxn.auth.controller;

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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final OAuthService oAuthService;

    /** 获取当前用户信息 */
    @GetMapping("/me")
    public Result<UserInfoResponse> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userService.getMe(userDetails.getUserId()));
    }

    /** 更新个人资料 */
    @PutMapping("/me")
    public Result<Void> updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
                                      @Valid @RequestBody UpdateProfileRequest req) {
        userService.updateProfile(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 修改/设置密码 */
    @PutMapping("/me/password")
    public Result<Void> setPassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                    @Valid @RequestBody SetPasswordRequest req) {
        userService.setPassword(userDetails.getUserId(), userDetails.getDeviceId(), req);
        return Result.success();
    }

    /** 获取所有登录设备 */
    @GetMapping("/me/devices")
    public Result<List<DeviceResponse>> listDevices(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userService.listDevices(userDetails.getUserId()));
    }

    /** 踢下线指定设备 */
    @DeleteMapping("/me/devices/{deviceId}")
    public Result<Void> revokeDevice(@AuthenticationPrincipal CustomUserDetails userDetails,
                                     @PathVariable String deviceId) {
        userService.revokeDevice(userDetails.getUserId(), deviceId);
        return Result.success();
    }

    /** 一键踢出所有其他设备 */
    @DeleteMapping("/me/devices")
    public Result<Void> revokeAllOtherDevices(@AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.revokeAllOtherDevices(userDetails.getUserId(), userDetails.getDeviceId());
        return Result.success();
    }

    // ── 绑定认证方式 ──────────────────────────────────────────

    /** 查询当前用户绑定的所有认证方式 */
    @GetMapping("/me/linked-accounts")
    public Result<List<LinkedAccountResponse>> listLinkedAccounts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(oAuthService.listLinkedAccounts(userDetails.getUserId()));
    }

    /** 绑定 GitHub 账号 */
    @PostMapping("/me/linked-accounts/github")
    public Result<Void> bindGitHub(@AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Valid @RequestBody OAuthBindRequest req) {
        oAuthService.bindGitHub(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 绑定 Google 账号 */
    @PostMapping("/me/linked-accounts/google")
    public Result<Void> bindGoogle(@AuthenticationPrincipal CustomUserDetails userDetails,
                                   @Valid @RequestBody OAuthBindRequest req) {
        oAuthService.bindGoogle(userDetails.getUserId(), req);
        return Result.success();
    }

    /** 解绑认证方式 */
    @DeleteMapping("/me/linked-accounts/{identityType}")
    public Result<Void> unbindAccount(@AuthenticationPrincipal CustomUserDetails userDetails,
                                      @PathVariable String identityType) {
        oAuthService.unbind(userDetails.getUserId(), identityType.toUpperCase());
        return Result.success();
    }
}
