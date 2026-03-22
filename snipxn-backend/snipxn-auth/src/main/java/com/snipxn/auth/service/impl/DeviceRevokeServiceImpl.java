package com.snipxn.auth.service.impl;

import com.snipxn.auth.service.DeviceRevokeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DeviceRevokeServiceImpl implements DeviceRevokeService {

    private final StringRedisTemplate redisTemplate;

    /** TTL 设为 Access Token 有效期，过期后 JWT 本身也失效，无需保留 */
    @Value("${snipxn.jwt.access-token-expire:7200}")
    private long accessTokenExpire;

    private static final String DEVICE_VERSION_KEY_PREFIX = "device:token:version:";
    private static final String USER_KEY_PREFIX = "user:revoked:";

    @Override
    public String issueDeviceTokenVersion(String userId, String deviceId, long ttlSeconds) {
        String key = buildDeviceVersionKey(userId, deviceId);
        String tokenVersion = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(key, tokenVersion, ttlSeconds, TimeUnit.SECONDS);
        return tokenVersion;
    }

    @Override
    public String reuseOrIssueDeviceTokenVersion(String userId, String deviceId, long ttlSeconds) {
        String key = buildDeviceVersionKey(userId, deviceId);
        String currentVersion = redisTemplate.opsForValue().get(key);
        if (StringUtils.hasText(currentVersion) && !currentVersion.startsWith("revoked:")) {
            redisTemplate.opsForValue().set(key, currentVersion, ttlSeconds, TimeUnit.SECONDS);
            return currentVersion;
        }
        return issueDeviceTokenVersion(userId, deviceId, ttlSeconds);
    }

    @Override
    public void revoke(String userId, String deviceId) {
        String key = buildDeviceVersionKey(userId, deviceId);
        String tombstoneVersion = "revoked:" + UUID.randomUUID();
        redisTemplate.opsForValue().set(key, tombstoneVersion, accessTokenExpire, TimeUnit.SECONDS);
    }

    @Override
    public boolean isDeviceTokenValid(String userId, String deviceId, String tokenVersion) {
        if (!StringUtils.hasText(tokenVersion)) {
            return false;
        }
        String currentVersion = redisTemplate.opsForValue().get(buildDeviceVersionKey(userId, deviceId));
        return StringUtils.hasText(currentVersion) && currentVersion.equals(tokenVersion);
    }

    @Override
    public void revokeUser(String userId) {
        String key = USER_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, "1", accessTokenExpire, TimeUnit.SECONDS);
    }

    @Override
    public boolean isUserRevoked(String userId) {
        String key = USER_KEY_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    @Override
    public void unRevokeUser(String userId) {
        redisTemplate.delete(USER_KEY_PREFIX + userId);
    }

    private String buildDeviceVersionKey(String userId, String deviceId) {
        return DEVICE_VERSION_KEY_PREFIX + userId + ":" + deviceId;
    }
}
