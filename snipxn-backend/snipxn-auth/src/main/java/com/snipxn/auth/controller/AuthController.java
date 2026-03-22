package com.snipxn.auth.controller;

import com.snipxn.auth.dto.req.LoginRequest;
import com.snipxn.auth.dto.req.RefreshTokenRequest;
import com.snipxn.auth.dto.req.RegisterRequest;
import com.snipxn.auth.dto.req.ResetPasswordRequest;
import com.snipxn.auth.dto.req.SendCodeRequest;
import com.snipxn.auth.dto.resp.LoginResponse;
import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.auth.service.AuthService;
import com.snipxn.auth.service.EmailService;
import com.snipxn.common.result.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final EmailService emailService;
    private final AuthService authService;

    /** 发送验证码 */
    @PostMapping("/code")
    public Result<Void> sendCode(@Valid @RequestBody SendCodeRequest req) {
        emailService.sendCode(req.getEmail().strip().toLowerCase(), req.getScene());
        return Result.success();
    }

    /** 邮箱注册 */
    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest req,
                                          HttpServletRequest httpRequest) {
        return Result.success(authService.register(req, getClientIp(httpRequest)));
    }

    /** 邮箱密码登录 */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req,
                                       HttpServletRequest httpRequest) {
        return Result.success(authService.login(req, getClientIp(httpRequest)));
    }

    /** 刷新 Token */
    @PostMapping("/refresh")
    public Result<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return Result.success(authService.refresh(req));
    }

    /** 忘记密码：通过邮箱验证码重置密码 */
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return Result.success();
    }

    /** 登出当前设备 */
    @PostMapping("/logout")
    public Result<Void> logout(@AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.logout(userDetails.getUserId(), userDetails.getDeviceId());
        return Result.success();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] ips = xff.split(",");
            return ips[ips.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
