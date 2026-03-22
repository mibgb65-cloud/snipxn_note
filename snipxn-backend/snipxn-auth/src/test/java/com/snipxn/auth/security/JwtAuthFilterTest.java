package com.snipxn.auth.security;

import com.snipxn.auth.service.DeviceRevokeService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private DeviceRevokeService deviceRevokeService;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAuthenticateWhenTokenVersionMatchesCurrentSession() throws Exception {
        Claims claims = mock(Claims.class);
        when(jwtUtil.parseSafe("valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("user-1");
        when(claims.get("deviceId", String.class)).thenReturn("device-1");
        when(claims.get("tokenVersion", String.class)).thenReturn("version-1");
        when(deviceRevokeService.isUserRevoked("user-1")).thenReturn(false);
        when(deviceRevokeService.isDeviceTokenValid("user-1", "device-1", "version-1")).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");

        jwtAuthFilter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        assertEquals("user-1", userDetails.getUserId());
        assertEquals("device-1", userDetails.getDeviceId());
    }

    @Test
    void shouldSkipAuthenticationWhenTokenVersionIsStale() throws Exception {
        Claims claims = mock(Claims.class);
        when(jwtUtil.parseSafe("stale-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("user-1");
        when(claims.get("deviceId", String.class)).thenReturn("device-1");
        when(claims.get("tokenVersion", String.class)).thenReturn("stale-version");
        when(deviceRevokeService.isUserRevoked("user-1")).thenReturn(false);
        when(deviceRevokeService.isDeviceTokenValid("user-1", "device-1", "stale-version")).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer stale-token");

        jwtAuthFilter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
