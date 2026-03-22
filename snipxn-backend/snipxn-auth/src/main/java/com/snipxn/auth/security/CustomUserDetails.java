package com.snipxn.auth.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security 用户上下文
 * 兼容密码登录认证和 JWT 鉴权两种场景，权限系统暂不细分 Role
 */
@Getter
public class CustomUserDetails implements UserDetails {

    private final String userId;
    private final String username;
    private final String password;
    private final String deviceId;
    private final boolean enabled;
    private final boolean accountNonLocked;

    public CustomUserDetails(String userId, String deviceId) {
        this(userId, userId, null, deviceId, true, true);
    }

    public CustomUserDetails(String userId,
                             String username,
                             String password,
                             boolean enabled,
                             boolean accountNonLocked) {
        this(userId, username, password, null, enabled, accountNonLocked);
    }

    private CustomUserDetails(String userId,
                              String username,
                              String password,
                              String deviceId,
                              boolean enabled,
                              boolean accountNonLocked) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.deviceId = deviceId;
        this.enabled = enabled;
        this.accountNonLocked = accountNonLocked;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
