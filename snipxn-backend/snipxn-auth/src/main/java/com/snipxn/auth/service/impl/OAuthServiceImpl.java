package com.snipxn.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snipxn.auth.config.OAuthProperties;
import com.snipxn.auth.dto.req.OAuthBindRequest;
import com.snipxn.auth.dto.req.OAuthLoginRequest;
import com.snipxn.auth.dto.resp.LinkedAccountResponse;
import com.snipxn.auth.dto.resp.LoginResponse;
import com.snipxn.auth.dto.resp.TokenResponse;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.entity.UserAuth;
import com.snipxn.auth.entity.UserSettings;
import com.snipxn.auth.mapper.UserAuthMapper;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.auth.mapper.UserSettingsMapper;
import com.snipxn.auth.service.OAuthService;
import com.snipxn.auth.service.TokenIssuanceService;
import com.snipxn.common.event.UserRegisteredEvent;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthServiceImpl implements OAuthService {

    private final OAuthProperties oAuthProperties;
    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;
    private final UserSettingsMapper userSettingsMapper;
    private final TokenIssuanceService tokenIssuanceService;
    private final ApplicationEventPublisher eventPublisher;

    private final RestClient restClient = RestClient.create();

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    // ══════════════════════════════════════════════════════════
    //  OAuth 信息交换（提取为复用方法）
    // ══════════════════════════════════════════════════════════

    private record OAuthUserInfo(String id, String email, String name, String avatar) {}

    private OAuthUserInfo exchangeGitHub(String code) {
        OAuthProperties.Provider github = oAuthProperties.getGithub();

        Map<String, Object> tokenResp;
        try {
            tokenResp = restClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "client_id", github.getClientId(),
                            "client_secret", github.getClientSecret(),
                            "code", code
                    ))
                    .retrieve()
                    .body(MAP_TYPE);
        } catch (RestClientException e) {
            log.error("GitHub token exchange failed", e);
            throw new BusinessException(ErrorCode.OAUTH_CODE_INVALID);
        }

        if (tokenResp == null || tokenResp.containsKey("error")) {
            throw new BusinessException(ErrorCode.OAUTH_CODE_INVALID);
        }
        String accessToken = (String) tokenResp.get("access_token");

        Map<String, Object> userInfo;
        try {
            userInfo = restClient.get()
                    .uri("https://api.github.com/user")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("User-Agent", "Snipxn-App")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(MAP_TYPE);
        } catch (RestClientException e) {
            log.error("GitHub user info fetch failed", e);
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }

        if (userInfo == null || userInfo.get("id") == null) {
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }

        String githubId = String.valueOf(userInfo.get("id"));
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String avatarUrl = (String) userInfo.get("avatar_url");

        if (email == null || email.isBlank()) {
            email = fetchGitHubPrimaryEmail(accessToken);
        }

        return new OAuthUserInfo(githubId, email, name, avatarUrl);
    }

    private String fetchGitHubPrimaryEmail(String accessToken) {
        try {
            List<Map<String, Object>> emails = restClient.get()
                    .uri("https://api.github.com/user/emails")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("User-Agent", "Snipxn-App")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (emails != null) {
                for (Map<String, Object> e : emails) {
                    if (Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified"))) {
                        return (String) e.get("email");
                    }
                }
            }
        } catch (RestClientException e) {
            log.warn("Failed to fetch GitHub emails", e);
        }
        return null;
    }

    private OAuthUserInfo exchangeGoogle(String code, String redirectUri) {
        OAuthProperties.Provider google = oAuthProperties.getGoogle();

        Map<String, Object> tokenResp;
        try {
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "authorization_code");
            formData.add("code", code);
            formData.add("client_id", google.getClientId());
            formData.add("client_secret", google.getClientSecret());
            formData.add("redirect_uri", redirectUri);

            tokenResp = restClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(MAP_TYPE);
        } catch (RestClientException e) {
            log.error("Google token exchange failed", e);
            throw new BusinessException(ErrorCode.OAUTH_CODE_INVALID);
        }

        if (tokenResp == null || tokenResp.containsKey("error")) {
            throw new BusinessException(ErrorCode.OAUTH_CODE_INVALID);
        }
        String accessToken = (String) tokenResp.get("access_token");

        Map<String, Object> userInfo;
        try {
            userInfo = restClient.get()
                    .uri("https://www.googleapis.com/oauth2/v2/userinfo")
                    .header("Authorization", "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(MAP_TYPE);
        } catch (RestClientException e) {
            log.error("Google user info fetch failed", e);
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }

        if (userInfo == null || userInfo.get("id") == null) {
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }

        String googleId = String.valueOf(userInfo.get("id"));
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String picture = (String) userInfo.get("picture");

        return new OAuthUserInfo(googleId, email, name, picture);
    }

    // ══════════════════════════════════════════════════════════
    //  OAuth 登录
    // ══════════════════════════════════════════════════════════

    @Override
    @Transactional
    public LoginResponse loginWithGitHub(OAuthLoginRequest request, String clientIp) {
        OAuthUserInfo info = exchangeGitHub(request.getCode());
        return findOrCreateOAuthUser("GITHUB", info.id(), info.email(), info.name(), info.avatar(),
                request.getDeviceId(), request.getDeviceName(), clientIp);
    }

    @Override
    @Transactional
    public LoginResponse loginWithGoogle(OAuthLoginRequest request, String clientIp) {
        OAuthUserInfo info = exchangeGoogle(request.getCode(), request.getRedirectUri());
        return findOrCreateOAuthUser("GOOGLE", info.id(), info.email(), info.name(), info.avatar(),
                request.getDeviceId(), request.getDeviceName(), clientIp);
    }

    // ══════════════════════════════════════════════════════════
    //  绑定 / 解绑 / 查询
    // ══════════════════════════════════════════════════════════

    @Override
    public List<LinkedAccountResponse> listLinkedAccounts(String userId) {
        List<UserAuth> auths = userAuthMapper.selectList(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, userId));

        return auths.stream().map(auth -> {
            String display;
            if ("PASSWORD".equals(auth.getIdentityType())) {
                display = maskEmail(auth.getIdentifier());
            } else {
                display = auth.getIdentityType();
            }
            return new LinkedAccountResponse(auth.getIdentityType(), display, auth.getCreatedAt());
        }).toList();
    }

    @Override
    @Transactional
    public void bindGitHub(String userId, OAuthBindRequest req) {
        OAuthUserInfo info = exchangeGitHub(req.getCode());
        doBind(userId, "GITHUB", info.id());
    }

    @Override
    @Transactional
    public void bindGoogle(String userId, OAuthBindRequest req) {
        OAuthUserInfo info = exchangeGoogle(req.getCode(), req.getRedirectUri());
        doBind(userId, "GOOGLE", info.id());
    }

    @Override
    @Transactional
    public void unbind(String userId, String identityType) {
        Long count = userAuthMapper.selectCount(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, userId));
        if (count == null || count <= 1) {
            throw new BusinessException(ErrorCode.OAUTH_UNBIND_LAST_AUTH);
        }

        userAuthMapper.delete(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, userId)
                .eq(UserAuth::getIdentityType, identityType));
    }

    // ══════════════════════════════════════════════════════════
    //  共用内部方法
    // ══════════════════════════════════════════════════════════

    private void doBind(String userId, String identityType, String identifier) {
        // 检查该 OAuth identifier 是否已绑定到其他用户
        UserAuth existing = userAuthMapper.selectOne(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getIdentityType, identityType)
                .eq(UserAuth::getIdentifier, identifier));
        if (existing != null) {
            if (existing.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.OAUTH_ALREADY_LINKED);
            }
            throw new BusinessException(ErrorCode.OAUTH_ALREADY_BOUND);
        }

        // 检查当前用户是否已有该 identity_type
        Long typeCount = userAuthMapper.selectCount(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, userId)
                .eq(UserAuth::getIdentityType, identityType));
        if (typeCount != null && typeCount > 0) {
            throw new BusinessException(ErrorCode.OAUTH_ALREADY_LINKED);
        }

        UserAuth newAuth = new UserAuth();
        newAuth.setUserId(userId);
        newAuth.setIdentityType(identityType);
        newAuth.setIdentifier(identifier);
        userAuthMapper.insert(newAuth);
    }

    private LoginResponse findOrCreateOAuthUser(String identityType, String identifier,
                                                 String email, String name, String avatar,
                                                 String deviceId, String deviceName, String clientIp) {
        UserAuth existingAuth = userAuthMapper.selectOne(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getIdentityType, identityType)
                .eq(UserAuth::getIdentifier, identifier));

        User user;

        if (existingAuth != null) {
            user = userMapper.selectById(existingAuth.getUserId());
            if (user == null) {
                throw new BusinessException(ErrorCode.NOT_FOUND);
            }
            if ("BANNED".equals(user.getStatus())) {
                throw new BusinessException(ErrorCode.ACCOUNT_BANNED);
            }
            if ("LOCKED".equals(user.getStatus())) {
                throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
            }
        } else if (email != null && !email.isBlank()) {
            String normalizedEmail = email.strip().toLowerCase();
            user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getEmail, normalizedEmail));

            if (user != null) {
                UserAuth newAuth = new UserAuth();
                newAuth.setUserId(user.getId());
                newAuth.setIdentityType(identityType);
                newAuth.setIdentifier(identifier);
                userAuthMapper.insert(newAuth);
            } else {
                user = createNewOAuthUser(identityType, identifier, normalizedEmail, name, avatar);
            }
        } else {
            user = createNewOAuthUser(identityType, identifier, null, name, avatar);
        }

        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        TokenResponse token = tokenIssuanceService.issueTokens(user.getId(), deviceId, deviceName, clientIp);
        return new LoginResponse(tokenIssuanceService.toUserInfo(user), token);
    }

    private User createNewOAuthUser(String identityType, String identifier,
                                     String email, String name, String avatar) {
        User user = new User();
        user.setEmail(email);
        user.setNickname(name);
        user.setAvatar(avatar);
        user.setStatus("ACTIVE");
        userMapper.insert(user);

        UserAuth auth = new UserAuth();
        auth.setUserId(user.getId());
        auth.setIdentityType(identityType);
        auth.setIdentifier(identifier);
        userAuthMapper.insert(auth);

        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        settings.setPreferences("{}");
        settings.setUpdatedAt(OffsetDateTime.now());
        userSettingsMapper.insert(settings);

        return user;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) {
            return local.charAt(0) + "***@" + domain;
        }
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + domain;
    }
}
