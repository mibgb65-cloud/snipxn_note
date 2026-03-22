package com.snipxn.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.auth.dto.req.LoginRequest;
import com.snipxn.auth.dto.req.RefreshTokenRequest;
import com.snipxn.auth.dto.req.RegisterRequest;
import com.snipxn.auth.dto.req.ResetPasswordRequest;
import com.snipxn.auth.dto.resp.LoginResponse;
import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.entity.UserAuth;
import com.snipxn.auth.entity.UserDevice;
import com.snipxn.auth.entity.UserSettings;
import com.snipxn.auth.mapper.UserAuthMapper;
import com.snipxn.auth.mapper.UserDeviceMapper;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.auth.mapper.UserSettingsMapper;
import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.auth.security.JwtUtil;
import com.snipxn.auth.service.AuthService;
import com.snipxn.auth.service.DeviceRevokeService;
import com.snipxn.auth.service.EmailService;
import com.snipxn.common.event.UserRegisteredEvent;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.redis.core.StringRedisTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;
    private final UserDeviceMapper userDeviceMapper;
    private final UserSettingsMapper userSettingsMapper;
    private final EmailService emailService;
    private final DeviceRevokeService deviceRevokeService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${snipxn.jwt.refresh-token-expire:604800}")
    private long refreshTokenExpire;

    @Value("${snipxn.jwt.access-token-expire:7200}")
    private long accessTokenExpire;

    private static final String LOGIN_FAIL_KEY_PREFIX = "rate:login:fail:";
    private static final long LOGIN_BACKOFF_BASE_SECONDS = 2;
    private static final long LOGIN_BACKOFF_MAX_SECONDS = 900;

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest req, String clientIp) {
        String email = req.getEmail().strip().toLowerCase();

        // 验证码校验（REGISTER 场景）
        emailService.verifyCode(email, req.getCode(), "REGISTER");

        // 邮箱唯一性校验（users 表 + user_auths 表）
        if (userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email)) > 0
            || userAuthMapper.selectCount(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getIdentityType, "PASSWORD")
                .eq(UserAuth::getIdentifier, email)) > 0) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 创建用户
        User user = new User();
        user.setEmail(email);
        user.setStatus("ACTIVE");
        userMapper.insert(user);

        // 创建密码认证记录
        UserAuth auth = new UserAuth();
        auth.setUserId(user.getId());
        auth.setIdentityType("PASSWORD");
        auth.setIdentifier(email);
        auth.setCredential(passwordEncoder.encode(req.getPassword()));
        userAuthMapper.insert(auth);

        // 初始化偏好配置
        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        settings.setPreferences("{}");
        settings.setUpdatedAt(OffsetDateTime.now());
        userSettingsMapper.insert(settings);

        // 签发 Token
        TokenResponse token = issueTokens(user.getId(), req.getDeviceId(), req.getDeviceName(), clientIp);
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        UserInfoResponse userInfo = toUserInfo(user);
        return new LoginResponse(userInfo, token);
    }

    @Override
    public LoginResponse login(LoginRequest req, String clientIp) {
        String email = req.getEmail().strip().toLowerCase();
        String failKey = buildLoginFailKey(email, clientIp);

        long retryAfterSeconds = getRetryAfterSeconds(failKey);
        if (retryAfterSeconds > 0) {
            throw new BusinessException(
                    ErrorCode.LOGIN_ATTEMPTS_LOCKED,
                    "登录失败过于频繁，请 " + retryAfterSeconds + " 秒后再试"
            );
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, req.getPassword())
            ).getPrincipal();

            User user = userMapper.selectById(userDetails.getUserId());
            if (user == null) {
                throw new BusinessException(ErrorCode.NOT_FOUND);
            }

            // 登录成功，清除失败计数
            redisTemplate.delete(failKey);

            TokenResponse token = issueTokens(user.getId(), req.getDeviceId(), req.getDeviceName(), clientIp);
            return new LoginResponse(toUserInfo(user), token);
        } catch (LockedException e) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        } catch (DisabledException e) {
            throw new BusinessException(ErrorCode.ACCOUNT_BANNED);
        } catch (AuthenticationException e) {
            Long attempts = redisTemplate.opsForValue().increment(failKey);
            long backoffSeconds = calculateLoginBackoffSeconds(attempts == null ? 1 : attempts);
            redisTemplate.expire(failKey, backoffSeconds, TimeUnit.SECONDS);
            throw new BusinessException(ErrorCode.PASSWORD_WRONG);
        }
    }

    @Override
    public TokenResponse refresh(RefreshTokenRequest req) {
        String tokenHash = sha256(req.getRefreshToken());

        UserDevice device = userDeviceMapper.selectOne(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getRefreshTokenHash, tokenHash)
                .eq(UserDevice::getDeviceId, req.getDeviceId()));

        if (device == null) {
            // 重放检测：旧 token 已被轮换，可能是被盗 token 重放
            detectTokenReuse(tokenHash, req.getDeviceId());
            throw new BusinessException(ErrorCode.TOKEN_REVOKED);
        }
        if (Boolean.TRUE.equals(device.getIsRevoked())) {
            throw new BusinessException(ErrorCode.TOKEN_REVOKED);
        }
        if (device.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        // 检查用户状态：BANNED / LOCKED 禁止刷新
        User user = userMapper.selectById(device.getUserId());
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        if ("BANNED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_BANNED);
        }
        if ("LOCKED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }

        // CAS 轮换：WHERE refresh_token_hash = oldHash 保证原子性
        String newRefreshToken = jwtUtil.generateRefreshToken();
        String newHash = sha256(newRefreshToken);
        int updated = userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                .eq(UserDevice::getId, device.getId())
                .eq(UserDevice::getRefreshTokenHash, tokenHash)
                .set(UserDevice::getPrevRefreshTokenHash, tokenHash)
                .set(UserDevice::getRefreshTokenHash, newHash)
                .set(UserDevice::getExpiresAt, OffsetDateTime.now().plusSeconds(refreshTokenExpire))
                .set(UserDevice::getLastLoginAt, OffsetDateTime.now()));

        if (updated == 0) {
            // 并发请求已抢先完成轮换，当前请求持有的是过期 hash
            throw new BusinessException(ErrorCode.TOKEN_REVOKED);
        }

        String tokenVersion = reuseOrIssueDeviceTokenVersion(device.getUserId(), device.getDeviceId());
        String newAccessToken = jwtUtil.generateAccessToken(device.getUserId(), device.getDeviceId(), tokenVersion);
        return new TokenResponse(newAccessToken, newRefreshToken, accessTokenExpire);
    }

    @Override
    public void logout(String userId, String deviceId) {
        userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getDeviceId, deviceId)
                .set(UserDevice::getIsRevoked, true));

        // Redis 黑名单，Access Token 立即失效
        deviceRevokeService.revoke(userId, deviceId);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String email = req.getEmail().strip().toLowerCase();

        // 验证码校验（RESET_PASSWORD 场景）
        emailService.verifyCode(email, req.getCode(), "RESET_PASSWORD");

        // 查找用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        // 更新密码
        UserAuth auth = userAuthMapper.selectOne(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, user.getId())
                .eq(UserAuth::getIdentityType, "PASSWORD"));

        if (auth != null) {
            userAuthMapper.update(new LambdaUpdateWrapper<UserAuth>()
                    .eq(UserAuth::getId, auth.getId())
                    .set(UserAuth::getCredential, passwordEncoder.encode(req.getNewPassword())));
        } else {
            // 第三方登录用户首次设置密码
            UserAuth newAuth = new UserAuth();
            newAuth.setUserId(user.getId());
            newAuth.setIdentityType("PASSWORD");
            newAuth.setIdentifier(email);
            newAuth.setCredential(passwordEncoder.encode(req.getNewPassword()));
            userAuthMapper.insert(newAuth);
        }

        // 重置密码后吊销所有设备（防止泄露的 Refresh Token 继续使用）
        revokeAllDevices(user.getId());
    }

    @Override
    @Transactional
    public void updateUserStatus(String userId, String status) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException(ErrorCode.NOT_FOUND);

        userMapper.update(new LambdaUpdateWrapper<User>()
                .eq(User::getId, userId)
                .set(User::getStatus, status));

        if ("BANNED".equals(status) || "LOCKED".equals(status)) {
            // 用户级 Redis 黑名单：所有 Access Token 立即失效
            deviceRevokeService.revokeUser(userId);
            // 吊销所有设备的 Refresh Token
            revokeAllDevices(userId);
        } else if ("ACTIVE".equals(status)) {
            // 解封：移除用户级 Redis 黑名单
            deviceRevokeService.unRevokeUser(userId);
        }
    }

    // ── 内部工具 ──────────────────────────────────────────────

    /**
     * 重放检测：已被轮换的旧 Refresh Token 再次出现，说明 token 可能被盗。
     * 安全策略：立即吊销该设备的所有 Token，攻击者和合法用户都需要重新登录。
     */
    private void detectTokenReuse(String tokenHash, String deviceId) {
        UserDevice device = userDeviceMapper.selectOne(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getPrevRefreshTokenHash, tokenHash)
                .eq(UserDevice::getDeviceId, deviceId));

        if (device != null) {
            // 旧 token 重放 → 吊销该设备
            userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                    .eq(UserDevice::getId, device.getId())
                    .set(UserDevice::getIsRevoked, true));
            deviceRevokeService.revoke(device.getUserId(), device.getDeviceId());
        }
    }

    /** 吊销某用户的所有设备（DB + Redis 黑名单） */
    private void revokeAllDevices(String userId) {
        List<UserDevice> devices = userDeviceMapper.selectList(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getIsRevoked, false));

        if (devices.isEmpty()) return;

        userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getIsRevoked, false)
                .set(UserDevice::getIsRevoked, true));

        for (UserDevice device : devices) {
            deviceRevokeService.revoke(userId, device.getDeviceId());
        }
    }

    private TokenResponse issueTokens(String userId, String deviceId, String deviceName, String clientIp) {
        String refreshToken = jwtUtil.generateRefreshToken();

        // 更新或新建设备记录（同一设备 ID 覆盖）
        UserDevice existing = userDeviceMapper.selectOne(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getDeviceId, deviceId));

        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(refreshTokenExpire);

        if (existing != null) {
            existing.setRefreshTokenHash(sha256(refreshToken));
            existing.setPrevRefreshTokenHash(null);
            existing.setExpiresAt(expiresAt);
            existing.setLastLoginIp(clientIp);
            existing.setLastLoginAt(OffsetDateTime.now());
            existing.setIsRevoked(false);
            userDeviceMapper.updateById(existing);
        } else {
            UserDevice device = new UserDevice();
            device.setUserId(userId);
            device.setDeviceId(deviceId);
            device.setDeviceName(truncate(deviceName, 100));
            device.setRefreshTokenHash(sha256(refreshToken));
            device.setExpiresAt(expiresAt);
            device.setLastLoginIp(clientIp);
            device.setLastLoginAt(OffsetDateTime.now());
            device.setIsRevoked(false);
            userDeviceMapper.insert(device);
        }

        String tokenVersion = issueDeviceTokenVersion(userId, deviceId);
        String accessToken = jwtUtil.generateAccessToken(userId, deviceId, tokenVersion);
        return new TokenResponse(accessToken, refreshToken, accessTokenExpire);
    }

    private String issueDeviceTokenVersion(String userId, String deviceId) {
        return deviceRevokeService.issueDeviceTokenVersion(
                userId,
                deviceId,
                refreshTokenExpire + accessTokenExpire
        );
    }

    private String reuseOrIssueDeviceTokenVersion(String userId, String deviceId) {
        return deviceRevokeService.reuseOrIssueDeviceTokenVersion(
                userId,
                deviceId,
                refreshTokenExpire + accessTokenExpire
        );
    }

    private UserInfoResponse toUserInfo(User user) {
        UserInfoResponse resp = new UserInfoResponse();
        BeanUtils.copyProperties(user, resp);
        return resp;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private String buildLoginFailKey(String email, String clientIp) {
        return LOGIN_FAIL_KEY_PREFIX + email + ":" + clientIp;
    }

    private long getRetryAfterSeconds(String failKey) {
        Long ttl = redisTemplate.getExpire(failKey, TimeUnit.SECONDS);
        return ttl == null || ttl <= 0 ? 0 : ttl;
    }

    private long calculateLoginBackoffSeconds(long attempts) {
        long exponent = Math.max(0, Math.min(attempts - 1, 20));
        long multiplier = 1L << exponent;
        return Math.min(LOGIN_BACKOFF_BASE_SECONDS * multiplier, LOGIN_BACKOFF_MAX_SECONDS);
    }
}
