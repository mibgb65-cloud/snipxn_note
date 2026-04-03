package com.snipxn.auth.controller;

import com.snipxn.auth.dto.req.CheckEmailRequest;
import com.snipxn.auth.dto.req.LoginRequest;
import com.snipxn.auth.dto.req.OAuthLoginRequest;
import com.snipxn.auth.dto.req.RefreshTokenRequest;
import com.snipxn.auth.dto.req.RegisterRequest;
import com.snipxn.auth.dto.req.ResetPasswordRequest;
import com.snipxn.auth.dto.req.SendCodeRequest;
import com.snipxn.auth.dto.resp.LoginResponse;
import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.auth.service.AuthService;
import com.snipxn.auth.service.EmailService;
import com.snipxn.auth.service.OAuthService;
import com.snipxn.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "认证", description = "注册、登录、令牌刷新与第三方 OAuth 登录相关接口")
public class AuthController {

    private final EmailService emailService;
    private final AuthService authService;
    private final OAuthService oAuthService;

    /** 检查邮箱是否已注册 */
    @Operation(summary = "检查邮箱是否已注册", description = "注册前用于校验邮箱是否已被占用")
    @PostMapping("/check-email")
    public Result<Boolean> checkEmail(@Valid @RequestBody CheckEmailRequest req) {
        return Result.success(authService.emailExists(req.getEmail()));
    }

    /** 发送验证码 */
    @Operation(summary = "发送邮箱验证码", description = "scene 支持 REGISTER 或 RESET_PASSWORD")
    @PostMapping("/code")
    public Result<Void> sendCode(@Valid @RequestBody SendCodeRequest req) {
        emailService.sendCode(req.getEmail().strip().toLowerCase(), req.getScene());
        return Result.success();
    }

    /** 邮箱注册 */
    @Operation(summary = "邮箱注册", description = "注册成功后直接返回 accessToken、refreshToken 与当前用户信息")
    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest req,
                                          HttpServletRequest httpRequest) {
        return Result.success(authService.register(req, getClientIp(httpRequest)));
    }

    /** 邮箱密码登录 */
    @Operation(summary = "邮箱密码登录", description = "登录成功后返回 accessToken、refreshToken 与当前用户信息")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req,
                                       HttpServletRequest httpRequest) {
        return Result.success(authService.login(req, getClientIp(httpRequest)));
    }

    /** 刷新 Token */
    @Operation(summary = "刷新访问令牌", description = "使用 refreshToken 换取新的 accessToken 和 refreshToken")
    @PostMapping("/refresh")
    public Result<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return Result.success(authService.refresh(req));
    }

    /** 忘记密码：通过邮箱验证码重置密码 */
    @Operation(summary = "重置密码", description = "通过邮箱验证码设置新密码，不需要旧密码")
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return Result.success();
    }

    /** 登出当前设备 */
    @Operation(summary = "退出当前设备登录", description = "仅使当前设备对应的登录态失效")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/logout")
    public Result<Void> logout(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.logout(userDetails.getUserId(), userDetails.getDeviceId());
        return Result.success();
    }

    /** GitHub OAuth 登录 */
    @Operation(summary = "GitHub OAuth 登录", description = "使用前端换取到的 GitHub 授权码完成登录")
    @PostMapping("/oauth/github")
    public Result<LoginResponse> oauthGitHub(@Valid @RequestBody OAuthLoginRequest req,
                                              HttpServletRequest httpRequest) {
        return Result.success(oAuthService.loginWithGitHub(req, getClientIp(httpRequest)));
    }

    /** Google OAuth 登录 */
    @Operation(summary = "Google OAuth 登录", description = "Google 授权码登录，redirectUri 需与 OAuth 配置一致")
    @PostMapping("/oauth/google")
    public Result<LoginResponse> oauthGoogle(@Valid @RequestBody OAuthLoginRequest req,
                                              HttpServletRequest httpRequest) {
        return Result.success(oAuthService.loginWithGoogle(req, getClientIp(httpRequest)));
    }

    private String getClientIp(HttpServletRequest request) {
        // Cloudflare 专用 header，始终为真实客户端 IP
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        // 回退：单层 Nginx 时取最后一个 XFF IP
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] ips = xff.split(",");
            return ips[ips.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
