package com.snipxn.auth.mq.consumer;

import com.rabbitmq.client.Channel;
import com.snipxn.auth.mq.message.EmailMessage;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailConsumerTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private Channel channel;

    @InjectMocks
    private EmailConsumer emailConsumer;

    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailConsumer, "mailFrom", "noreply@example.com");
        ReflectionTestUtils.setField(emailConsumer, "emailRetryExchange", "snipxn.email.retry.exchange");
        ReflectionTestUtils.setField(emailConsumer, "emailRetryRoutingKey", "email.send.retry");
        ReflectionTestUtils.setField(emailConsumer, "emailMaxRetries", 3);
        ReflectionTestUtils.setField(emailConsumer, "emailRetryDelayMs", 30000L);
        mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void shouldAckAfterSuccessfulSend() throws Exception {
        EmailMessage message = new EmailMessage("user@example.com", "subject", "content", "<html><body>content</body></html>");

        emailConsumer.onEmailMessage(message, channel, 11L, null);

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(same(mimeMessage));
        verify(channel).basicAck(11L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void shouldRepublishToRetryQueueAndAckWhenSendFailsBeforeMaxRetries() throws Exception {
        EmailMessage message = new EmailMessage("user@example.com", "subject", "content", "<html><body>content</body></html>");
        doThrow(new MailSendException("smtp down")).when(mailSender)
                .send(any(MimeMessage.class));

        emailConsumer.onEmailMessage(message, channel, 12L, 1);

        ArgumentCaptor<MessagePostProcessor> postProcessorCaptor =
                ArgumentCaptor.forClass(MessagePostProcessor.class);
        verify(rabbitTemplate).convertAndSend(
                eq("snipxn.email.retry.exchange"),
                eq("email.send.retry"),
                same(message),
                postProcessorCaptor.capture()
        );

        Message amqpMessage = new Message(new byte[0], new MessageProperties());
        postProcessorCaptor.getValue().postProcessMessage(amqpMessage);
        assertEquals(2, amqpMessage.getMessageProperties().getHeaders().get("x-retry-count"));
        verify(channel).basicAck(12L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void shouldNackWithoutRequeueWhenRetriesAreExhausted() throws Exception {
        EmailMessage message = new EmailMessage("user@example.com", "subject", "content", "<html><body>content</body></html>");
        doThrow(new MailSendException("smtp down")).when(mailSender)
                .send(any(MimeMessage.class));

        emailConsumer.onEmailMessage(message, channel, 13L, 3);

        verify(rabbitTemplate, never()).convertAndSend(any(String.class), any(String.class), any(), any(MessagePostProcessor.class));
        verify(channel).basicNack(13L, false, false);
        verify(channel, never()).basicAck(13L, false);
    }

    @Test
    void shouldNackToDlqWhenRetryDispatchFails() throws Exception {
        EmailMessage message = new EmailMessage("user@example.com", "subject", "content", "<html><body>content</body></html>");
        doThrow(new MailSendException("smtp down")).when(mailSender)
                .send(any(MimeMessage.class));
        doThrow(new RuntimeException("retry publish failed")).when(rabbitTemplate)
                .convertAndSend(any(String.class), any(String.class), any(), any(MessagePostProcessor.class));

        emailConsumer.onEmailMessage(message, channel, 14L, 0);

        verify(channel).basicNack(14L, false, false);
        verify(channel, never()).basicAck(14L, false);
    }
}
