package com.snipxn.auth.service;

import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;
import com.snipxn.auth.entity.User;

public interface TokenIssuanceService {

    /** 为指定用户/设备签发 Access + Refresh Token */
    TokenResponse issueTokens(String userId, String deviceId, String deviceName, String clientIp);

    /** User 实体 → UserInfoResponse */
    UserInfoResponse toUserInfo(User user);

    /** SHA-256 摘要（hex 编码） */
    String sha256(String input);
}
