package com.snipxn.auth.service;

import com.snipxn.auth.dto.req.OAuthBindRequest;
import com.snipxn.auth.dto.req.OAuthLoginRequest;
import com.snipxn.auth.dto.resp.LinkedAccountResponse;
import com.snipxn.auth.dto.resp.LoginResponse;

import java.util.List;

public interface OAuthService {

    /** GitHub OAuth 登录 */
    LoginResponse loginWithGitHub(OAuthLoginRequest request, String clientIp);

    /** Google OAuth 登录 */
    LoginResponse loginWithGoogle(OAuthLoginRequest request, String clientIp);

    /** 查询当前用户绑定的所有认证方式 */
    List<LinkedAccountResponse> listLinkedAccounts(String userId);

    /** 绑定 GitHub 账号 */
    void bindGitHub(String userId, OAuthBindRequest req);

    /** 绑定 Google 账号 */
    void bindGoogle(String userId, OAuthBindRequest req);

    /** 解绑某个认证方式 */
    void unbind(String userId, String identityType);
}
