package com.snipxn.auth.service;

/**
 * Redis 中维护访问令牌的设备会话版本和用户级封禁状态
 */
public interface DeviceRevokeService {

    /** 为设备签发新的 Access Token 版本，旧版本随即失效 */
    String issueDeviceTokenVersion(String userId, String deviceId, long ttlSeconds);

    /** 延长当前设备会话版本的有效期；若缓存缺失则补发一个新版本 */
    String reuseOrIssueDeviceTokenVersion(String userId, String deviceId, long ttlSeconds);

    /** 将设备加入失效状态，保证当前 Access Token 在有效期内立即失效 */
    void revoke(String userId, String deviceId);

    /** 检查设备 Access Token 版本是否仍有效 */
    boolean isDeviceTokenValid(String userId, String deviceId, String tokenVersion);

    /** 封禁/锁定用户：所有设备的 Access Token 立即失效，TTL = Access Token 有效期 */
    void revokeUser(String userId);

    /** 检查用户是否被封禁（用户级黑名单） */
    boolean isUserRevoked(String userId);

    /** 解封用户：移除用户级黑名单 */
    void unRevokeUser(String userId);
}
