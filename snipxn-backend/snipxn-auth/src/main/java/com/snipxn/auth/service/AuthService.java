package com.snipxn.auth.service;

import com.snipxn.auth.dto.req.LoginRequest;
import com.snipxn.auth.dto.req.RefreshTokenRequest;
import com.snipxn.auth.dto.req.RegisterRequest;
import com.snipxn.auth.dto.req.ResetPasswordRequest;
import com.snipxn.auth.dto.resp.LoginResponse;
import com.snipxn.auth.dto.resp.TokenResponse;

public interface AuthService {

    /** 邮箱+验证码+密码注册，注册成功直接返回 Token */
    LoginResponse register(RegisterRequest request, String clientIp);

    /** 邮箱+密码登录 */
    LoginResponse login(LoginRequest request, String clientIp);

    /** Refresh Token 换新双 Token */
    TokenResponse refresh(RefreshTokenRequest request);

    /** 登出当前设备（吊销 Refresh Token） */
    void logout(String userId, String deviceId);

    /** 忘记密码：通过邮箱验证码重置密码 */
    void resetPassword(ResetPasswordRequest request);

    /** 检查邮箱是否已注册 */
    boolean emailExists(String email);

    /** 修改用户状态（ACTIVE / BANNED / LOCKED），同步 Redis 黑名单使 Token 立即失效/恢复 */
    void updateUserStatus(String userId, String status);
}
