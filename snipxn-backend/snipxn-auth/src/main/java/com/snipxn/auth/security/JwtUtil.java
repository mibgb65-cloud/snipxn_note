package com.snipxn.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * JWT 工具类（仅处理 Access Token）
 * Access Token：JWT，有效期 2 小时，无需 DB 查询即可验证
 * Refresh Token：随机 UUID 明文，哈希存 DB，不经此类处理
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenExpire;
    private static final String TOKEN_VERSION_CLAIM = "tokenVersion";

    public JwtUtil(
            @Value("${snipxn.jwt.secret}") String secret,
            @Value("${snipxn.jwt.access-token-expire}") long accessTokenExpire) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpire = accessTokenExpire;
    }

    /** 生成 Access Token，claims 中包含 userId、deviceId 和设备会话版本 */
    public String generateAccessToken(String userId, String deviceId, String tokenVersion) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId)
                .claim("deviceId", deviceId)
                .claim(TOKEN_VERSION_CLAIM, tokenVersion)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTokenExpire * 1000))
                .signWith(secretKey)
                .compact();
    }

    /** 生成不透明 Refresh Token（随机 UUID 明文，由调用方负责哈希存 DB） */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 解析 Access Token，失败时抛出 JwtException */
    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseAccessToken(token).getSubject();
    }

    public String extractDeviceId(String token) {
        return parseAccessToken(token).get("deviceId", String.class);
    }

    public String extractTokenVersion(String token) {
        return parseAccessToken(token).get(TOKEN_VERSION_CLAIM, String.class);
    }

    /** 安全解析，失败返回 null（供 Filter 一次解析复用） */
    public Claims parseSafe(String token) {
        try {
            return parseAccessToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean isValid(String token) {
        return parseSafe(token) != null;
    }
}
