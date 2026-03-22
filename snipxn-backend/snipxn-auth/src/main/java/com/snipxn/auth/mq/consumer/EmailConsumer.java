package com.snipxn.auth.mq.consumer;

import com.rabbitmq.client.Channel;
import com.snipxn.auth.mq.message.EmailMessage;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.messaging.handler.annotation.Header;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private static final String RETRY_COUNT_HEADER = "x-retry-count";

    private final JavaMailSender mailSender;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Value("${snipxn.mail.from}")
    private String mailFrom;

    @Value("${snipxn.mq.email-retry-exchange:snipxn.email.retry.exchange}")
    private String emailRetryExchange;

    @Value("${snipxn.mq.email-retry-routing-key:email.send.retry}")
    private String emailRetryRoutingKey;

    @Value("${snipxn.mq.email-max-retries:3}")
    private int emailMaxRetries;

    @Value("${snipxn.mq.email-retry-delay-ms:30000}")
    private long emailRetryDelayMs;

    @RabbitListener(
            queues = "${snipxn.mq.email-queue:snipxn.email.queue}",
            containerFactory = "manualAckRabbitListenerContainerFactory"
    )
    public void onEmailMessage(EmailMessage message,
                               Channel channel,
                               @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
                               @Header(name = RETRY_COUNT_HEADER, required = false) Integer retryCount) throws IOException {
        int currentRetryCount = retryCount == null ? 0 : retryCount;

        try {
            MimeMessage mail = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mail, true, StandardCharsets.UTF_8.name());
            helper.setFrom(resolveFromAddress());
            helper.setTo(message.getTo());
            helper.setSubject(message.getSubject());
            if (message.getHtmlContent() != null && !message.getHtmlContent().isBlank()) {
                helper.setText(resolveTextContent(message), message.getHtmlContent());
            } else {
                helper.setText(resolveTextContent(message), false);
            }
            mailSender.send(mail);

            channel.basicAck(deliveryTag, false);
            log.info("邮件发送成功: {}", message.getTo());
        } catch (Exception e) {
            handleFailure(message, channel, deliveryTag, currentRetryCount, e);
        }
    }

    private void handleFailure(EmailMessage message,
                               Channel channel,
                               long deliveryTag,
                               int currentRetryCount,
                               Exception cause) throws IOException {
        if (currentRetryCount < emailMaxRetries) {
            int nextRetryCount = currentRetryCount + 1;
            try {
                rabbitTemplate.convertAndSend(
                        emailRetryExchange,
                        emailRetryRoutingKey,
                        message,
                        retryHeader(nextRetryCount)
                );
                channel.basicAck(deliveryTag, false);
                log.warn(
                        "邮件发送失败，{} ms 后进行第 {}/{} 次重试: {}",
                        emailRetryDelayMs,
                        nextRetryCount,
                        emailMaxRetries,
                        message.getTo(),
                        cause
                );
                return;
            } catch (Exception retryDispatchException) {
                log.error("邮件发送失败且重试投递失败，消息转入 DLQ: {}", message.getTo(), retryDispatchException);
            }
        } else {
            log.error(
                    "邮件发送失败，已超过最大重试次数({})，消息转入 DLQ: {}",
                    emailMaxRetries,
                    message.getTo(),
                    cause
            );
        }

        channel.basicNack(deliveryTag, false, false);
    }

    private MessagePostProcessor retryHeader(int retryCount) {
        return message -> {
            message.getMessageProperties().setHeader(RETRY_COUNT_HEADER, retryCount);
            return message;
        };
    }

    private String resolveTextContent(EmailMessage message) {
        return message.getContent() == null ? "" : message.getContent();
    }

    private String resolveFromAddress() {
        try {
            InternetAddress address = new InternetAddress(mailFrom, true);
            address.validate();
            return address.toUnicodeString();
        } catch (AddressException e) {
            throw new IllegalStateException("配置项 snipxn.mail.from 格式非法: " + mailFrom, e);
        }
    }
}
