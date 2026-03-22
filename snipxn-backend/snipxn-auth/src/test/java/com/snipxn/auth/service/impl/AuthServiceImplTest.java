package com.snipxn.auth.service.impl;

import com.snipxn.auth.dto.req.LoginRequest;
import com.snipxn.auth.mapper.UserAuthMapper;
import com.snipxn.auth.mapper.UserDeviceMapper;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.auth.mapper.UserSettingsMapper;
import com.snipxn.auth.security.JwtUtil;
import com.snipxn.auth.service.DeviceRevokeService;
import com.snipxn.auth.service.EmailService;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserAuthMapper userAuthMapper;

    @Mock
    private UserDeviceMapper userDeviceMapper;

    @Mock
    private UserSettingsMapper userSettingsMapper;

    @Mock
    private EmailService emailService;

    @Mock
    private DeviceRevokeService deviceRevokeService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenExpire", 604800L);
        ReflectionTestUtils.setField(authService, "accessTokenExpire", 7200L);
    }

    @Test
    void shouldBlockRepeatedFailuresForSameAccountAndIpDuringBackoffWindow() {
        LoginRequest request = new LoginRequest();
        request.setEmail("USER@example.com");
        request.setPassword("wrong-password");
        request.setDeviceId("device-1");

        String failKey = "rate:login:fail:user@example.com:10.0.0.8";
        when(redisTemplate.getExpire(failKey, TimeUnit.SECONDS)).thenReturn(8L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request, "10.0.0.8")
        );

        assertEquals(ErrorCode.LOGIN_ATTEMPTS_LOCKED, exception.getErrorCode());
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void shouldApplyExponentialBackoffPerAccountAndIpAfterAuthenticationFailure() {
        LoginRequest request = new LoginRequest();
        request.setEmail("USER@example.com");
        request.setPassword("wrong-password");
        request.setDeviceId("device-1");

        String failKey = "rate:login:fail:user@example.com:10.0.0.8";
        when(redisTemplate.getExpire(failKey, TimeUnit.SECONDS)).thenReturn(-2L);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));
        when(valueOperations.increment(failKey)).thenReturn(3L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.login(request, "10.0.0.8")
        );

        assertEquals(ErrorCode.PASSWORD_WRONG, exception.getErrorCode());
        verify(valueOperations).increment(failKey);
        verify(redisTemplate).expire(failKey, 8L, TimeUnit.SECONDS);
        verify(redisTemplate, never()).delete(failKey);
    }
}
