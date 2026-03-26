package com.snipxn.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.entity.UserDevice;
import com.snipxn.auth.mapper.UserDeviceMapper;
import com.snipxn.auth.security.JwtUtil;
import com.snipxn.auth.service.DeviceRevokeService;
import com.snipxn.auth.service.TokenIssuanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class TokenIssuanceServiceImpl implements TokenIssuanceService {

    private final UserDeviceMapper userDeviceMapper;
    private final JwtUtil jwtUtil;
    private final DeviceRevokeService deviceRevokeService;

    @Value("${snipxn.jwt.refresh-token-expire:604800}")
    private long refreshTokenExpire;

    @Value("${snipxn.jwt.access-token-expire:7200}")
    private long accessTokenExpire;

    @Override
    public TokenResponse issueTokens(String userId, String deviceId, String deviceName, String clientIp) {
        String refreshToken = jwtUtil.generateRefreshToken();

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

        String tokenVersion = deviceRevokeService.issueDeviceTokenVersion(
                userId, deviceId, refreshTokenExpire + accessTokenExpire);
        String accessToken = jwtUtil.generateAccessToken(userId, deviceId, tokenVersion);
        return new TokenResponse(accessToken, refreshToken, accessTokenExpire);
    }

    @Override
    public UserInfoResponse toUserInfo(User user) {
        UserInfoResponse resp = new UserInfoResponse();
        BeanUtils.copyProperties(user, resp);
        return resp;
    }

    @Override
    public String sha256(String input) {
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
}
