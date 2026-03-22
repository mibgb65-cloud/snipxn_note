package com.snipxn.auth.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {

    private UserInfoResponse user;
    private TokenResponse token;
}
