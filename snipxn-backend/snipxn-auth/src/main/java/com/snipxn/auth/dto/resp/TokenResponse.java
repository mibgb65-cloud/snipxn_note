package com.snipxn.auth.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    /** Access Token 过期时间（秒） */
    private long expiresIn;
}
