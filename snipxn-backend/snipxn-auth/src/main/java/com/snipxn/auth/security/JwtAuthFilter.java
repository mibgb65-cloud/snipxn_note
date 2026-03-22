package com.snipxn.auth.security;

import com.snipxn.auth.service.DeviceRevokeService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器：每次请求解析 Authorization: Bearer <token>
 * 验证通过后检查 Redis 黑名单，再将 CustomUserDetails 写入 SecurityContext
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final DeviceRevokeService deviceRevokeService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);

        if (StringUtils.hasText(token)) {
            Claims claims = jwtUtil.parseSafe(token);
            if (claims != null) {
                String userId = claims.getSubject();
                String deviceId = claims.get("deviceId", String.class);
                String tokenVersion = claims.get("tokenVersion", String.class);

                // 检查用户是否被封禁，并确认当前设备 Access Token 仍属于最新会话
                if (!deviceRevokeService.isUserRevoked(userId)
                        && deviceRevokeService.isDeviceTokenValid(userId, deviceId, tokenVersion)) {
                    CustomUserDetails userDetails = new CustomUserDetails(userId, deviceId);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
