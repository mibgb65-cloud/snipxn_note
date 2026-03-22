package com.snipxn.auth.service.impl;

import com.snipxn.auth.mq.message.EmailMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    private static final Pattern CODE_PATTERN = Pattern.compile("(\\d{6})");

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        ReflectionTestUtils.setField(emailService, "codeExpire", 300L);
        ReflectionTestUtils.setField(emailService, "codeCooldown", 60L);
        ReflectionTestUtils.setField(emailService, "emailExchange", "snipxn.email.exchange");
        ReflectionTestUtils.setField(emailService, "emailRoutingKey", "email.send");
    }

    @Test
    void shouldClearVerifyFailCounterWhenIssuingNewCode() {
        String email = "user@example.com";
        String scene = "REGISTER";
        String codeKey = "email:code:REGISTER:user@example.com";
        String cooldownKey = "email:code:cooldown:REGISTER:user@example.com";
        String failKey = "email:code:fail:REGISTER:user@example.com";

        when(redisTemplate.hasKey(cooldownKey)).thenReturn(false);

        emailService.sendCode(email, scene);

        verify(valueOperations).set(eq(codeKey), anyString(), eq(300L), eq(TimeUnit.SECONDS));
        verify(valueOperations).set(cooldownKey, "1", 60L, TimeUnit.SECONDS);
        verify(redisTemplate).delete(failKey);

        ArgumentCaptor<EmailMessage> messageCaptor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(rabbitTemplate).convertAndSend(eq("snipxn.email.exchange"), eq("email.send"), messageCaptor.capture());

        EmailMessage message = messageCaptor.getValue();
        assertNotNull(message.getHtmlContent());
        assertTrue(message.getHtmlContent().contains("<html"));
        assertTrue(message.getHtmlContent().contains("Verification Code"));

        Matcher matcher = CODE_PATTERN.matcher(message.getContent());
        assertTrue(matcher.find());
        assertTrue(message.getHtmlContent().contains(matcher.group(1)));
    }
}
