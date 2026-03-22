package com.snipxn.auth.service.impl;

import com.snipxn.auth.mq.message.EmailMessage;
import com.snipxn.auth.service.EmailService;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final StringRedisTemplate redisTemplate;
    private final RabbitTemplate rabbitTemplate;

    @Value("${snipxn.mail.from}")
    private String mailFrom;

    @Value("${snipxn.mail.code-expire:300}")
    private long codeExpire;

    @Value("${snipxn.mail.code-cooldown:60}")
    private long codeCooldown;

    @Value("${snipxn.mq.email-exchange:snipxn.email.exchange}")
    private String emailExchange;

    @Value("${snipxn.mq.email-routing-key:email.send}")
    private String emailRoutingKey;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** Redis key 格式: email:code:{scene}:{email} */
    private static final String CODE_KEY_PREFIX = "email:code:";
    private static final String COOLDOWN_KEY_PREFIX = "email:code:cooldown:";
    private static final String VERIFY_FAIL_KEY_PREFIX = "email:code:fail:";

    /** 验证码最多允许错误 5 次，超过后删除验证码并锁定 15 分钟 */
    private static final int VERIFY_MAX_ATTEMPTS = 5;
    private static final long VERIFY_LOCK_SECONDS = 900;

    @Override
    public void sendCode(String email, String scene) {
        String codeKey = CODE_KEY_PREFIX + scene + ":" + email;
        String cooldownKey = COOLDOWN_KEY_PREFIX + scene + ":" + email;
        String failKey = VERIFY_FAIL_KEY_PREFIX + scene + ":" + email;

        // 冷却校验
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_TOO_FREQUENT);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        // 存验证码（5 分钟有效）
        redisTemplate.opsForValue().set(codeKey, code, codeExpire, TimeUnit.SECONDS);
        // 存冷却标记（60 秒内不可再发）
        redisTemplate.opsForValue().set(cooldownKey, "1", codeCooldown, TimeUnit.SECONDS);
        // 新 challenge 生成后清空旧失败计数，避免历史错误锁死新验证码
        redisTemplate.delete(failKey);

        String sceneLabel = resolveSceneLabel(scene);
        String textContent = buildCodeTextContent(sceneLabel, code);
        String htmlContent = buildCodeHtmlContent(sceneLabel, code);
        EmailMessage message = new EmailMessage(
                email,
                "Snipxn 验证码",
                textContent,
                htmlContent
        );
        rabbitTemplate.convertAndSend(emailExchange, emailRoutingKey, message);
        log.info("验证码已投递 MQ: scene={}, email={}", scene, email);
    }

    @Override
    public void verifyCode(String email, String code, String scene) {
        String codeKey = CODE_KEY_PREFIX + scene + ":" + email;
        String failKey = VERIFY_FAIL_KEY_PREFIX + scene + ":" + email;

        // 检查是否已因错误过多被锁定
        String failCount = redisTemplate.opsForValue().get(failKey);
        if (failCount != null && Integer.parseInt(failCount) >= VERIFY_MAX_ATTEMPTS) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_VERIFY_LOCKED);
        }

        String cached = redisTemplate.opsForValue().get(codeKey);
        if (cached == null || !cached.equals(code)) {
            // 递增失败计数
            Long count = redisTemplate.opsForValue().increment(failKey);
            redisTemplate.expire(failKey, VERIFY_LOCK_SECONDS, TimeUnit.SECONDS);
            if (count != null && count >= VERIFY_MAX_ATTEMPTS) {
                // 错误过多，删除验证码，强制重新获取
                redisTemplate.delete(codeKey);
                throw new BusinessException(ErrorCode.EMAIL_CODE_VERIFY_LOCKED);
            }
            throw new BusinessException(ErrorCode.EMAIL_CODE_INVALID);
        }

        // 验证通过，删除验证码和失败计数
        redisTemplate.delete(codeKey);
        redisTemplate.delete(failKey);
    }

    private String resolveSceneLabel(String scene) {
        return switch (scene) {
            case "REGISTER" -> "注册验证";
            case "RESET_PASSWORD" -> "重置密码验证";
            default -> "身份验证";
        };
    }

    private String buildCodeTextContent(String sceneLabel, String code) {
        return "您正在进行 Snipxn " + sceneLabel + "。\n\n"
                + "验证码：" + code + "\n"
                + "有效期：" + (codeExpire / 60) + " 分钟\n\n"
                + "如非本人操作，请忽略此邮件。";
    }

    private String buildCodeHtmlContent(String sceneLabel, String code) {
        return """
                <!DOCTYPE html>
                <html lang="zh-CN">
                <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;">
                  <div style="max-width:560px;margin:32px auto;padding:0 16px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
                      <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
                        <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.82;">Snipxn</div>
                        <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;">%s</h1>
                      </div>
                      <div style="padding:32px;">
                        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">您好，您本次请求的验证码如下：</p>
                        <div style="margin:24px 0;padding:18px 20px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;">
                          <div style="font-size:13px;color:#1d4ed8;letter-spacing:0.08em;text-transform:uppercase;">Verification Code</div>
                          <div style="margin-top:8px;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#0f172a;">%s</div>
                        </div>
                        <p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:#4b5563;">验证码将在 <strong>%d 分钟</strong> 后失效，请勿泄露给他人。</p>
                        <p style="margin:0;font-size:14px;line-height:1.8;color:#6b7280;">如果这不是您的操作，直接忽略本邮件即可。</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(sceneLabel, code, codeExpire / 60);
    }
}
