package com.snipxn.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("user_devices")
public class UserDevice extends BaseEntity {

    private String userId;
    private String deviceName;
    private String deviceId;
    /** Refresh Token 的 SHA-256 哈希值（不存明文） */
    private String refreshTokenHash;
    private OffsetDateTime expiresAt;
    private String lastLoginIp;
    private OffsetDateTime lastLoginAt;
    /** 上一次 Refresh Token 的哈希值，用于重放检测 */
    private String prevRefreshTokenHash;
    /** 是否已吊销（踢下线后置 true） */
    private Boolean isRevoked;
}
