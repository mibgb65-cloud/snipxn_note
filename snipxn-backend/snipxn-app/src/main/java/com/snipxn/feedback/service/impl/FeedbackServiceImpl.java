package com.snipxn.feedback.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.auth.mq.message.EmailMessage;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.feedback.dto.req.CreateFeedbackRequest;
import com.snipxn.feedback.dto.resp.FeedbackResponse;
import com.snipxn.feedback.entity.Feedback;
import com.snipxn.feedback.mapper.FeedbackMapper;
import com.snipxn.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final String STATUS_PENDING = "PENDING";
    private static final int EMAIL_CONTENT_PREVIEW_LIMIT = 800;

    private final FeedbackMapper feedbackMapper;
    private final UserMapper userMapper;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${snipxn.mq.email-exchange:snipxn.email.exchange}")
    private String emailExchange;

    @Value("${snipxn.mq.email-routing-key:email.send}")
    private String emailRoutingKey;

    @Override
    @Transactional
    public FeedbackResponse createFeedback(String userId, CreateFeedbackRequest request) {
        Feedback feedback = new Feedback();
        feedback.setUserId(StringUtils.hasText(userId) ? userId : null);
        feedback.setContent(request.getContent().trim());
        feedback.setContact(normalizeContact(request.getContact()));
        feedback.setImages(serializeImages(request.getImages()));
        feedback.setStatus(STATUS_PENDING);

        feedbackMapper.insert(feedback);

        boolean confirmationEmailQueued = queueConfirmationEmail(feedback);

        FeedbackResponse response = new FeedbackResponse();
        response.setId(feedback.getId());
        response.setStatus(feedback.getStatus());
        response.setCreatedAt(feedback.getCreatedAt());
        response.setConfirmationEmailQueued(confirmationEmailQueued);
        return response;
    }

    private String normalizeContact(String contact) {
        if (!StringUtils.hasText(contact)) {
            return null;
        }
        return contact.trim();
    }

    private String serializeImages(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images == null ? List.of() : images);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Feedback images serialization failed");
        }
    }

    private boolean queueConfirmationEmail(Feedback feedback) {
        if (!StringUtils.hasText(feedback.getUserId())) {
            return false;
        }

        User user = userMapper.selectById(feedback.getUserId());
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            return false;
        }

        try {
            EmailMessage message = new EmailMessage(
                    user.getEmail(),
                    "Snipxn feedback received",
                    buildConfirmationText(user, feedback),
                    buildConfirmationHtml(user, feedback)
            );
            rabbitTemplate.convertAndSend(emailExchange, emailRoutingKey, message);
            return true;
        } catch (Exception e) {
            log.warn("Failed to queue feedback confirmation email: feedbackId={}, userId={}",
                    feedback.getId(),
                    feedback.getUserId(),
                    e);
            return false;
        }
    }

    private String buildConfirmationText(User user, Feedback feedback) {
        return "Hi " + displayName(user) + ",\n\n"
                + "We have received your Snipxn feedback.\n\n"
                + "Feedback ID: " + feedback.getId() + "\n"
                + "Status: " + feedback.getStatus() + "\n\n"
                + "Content preview:\n"
                + contentPreview(feedback.getContent()) + "\n\n"
                + "Thanks for helping improve Snipxn.";
    }

    private String buildConfirmationHtml(User user, Feedback feedback) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;">
                  <div style="max-width:600px;margin:32px auto;padding:0 16px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
                      <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#ffffff;">
                        <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.82;">Snipxn</div>
                        <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;">Feedback received</h1>
                      </div>
                      <div style="padding:32px;">
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">Hi %s, we have received your feedback and saved it for follow-up.</p>
                        <div style="margin:0 0 20px;padding:16px 18px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;">
                          <p style="margin:0 0 8px;font-size:14px;color:#1d4ed8;"><strong>Feedback ID</strong></p>
                          <p style="margin:0;font-family:Consolas,monospace;font-size:14px;color:#0f172a;">%s</p>
                          <p style="margin:14px 0 8px;font-size:14px;color:#1d4ed8;"><strong>Status</strong></p>
                          <p style="margin:0;font-family:Consolas,monospace;font-size:14px;color:#0f172a;">%s</p>
                        </div>
                        <p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:#4b5563;"><strong>Content preview</strong></p>
                        <div style="padding:14px 16px;border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;font-size:14px;line-height:1.8;white-space:pre-wrap;">%s</div>
                        <p style="margin:20px 0 0;font-size:14px;line-height:1.8;color:#6b7280;">Thanks for helping improve Snipxn.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                escapeHtml(displayName(user)),
                escapeHtml(feedback.getId()),
                escapeHtml(feedback.getStatus()),
                escapeHtml(contentPreview(feedback.getContent()))
        );
    }

    private String displayName(User user) {
        if (StringUtils.hasText(user.getNickname())) {
            return user.getNickname().trim();
        }
        return user.getEmail();
    }

    private String contentPreview(String content) {
        String normalized = content == null ? "" : content.trim();
        if (normalized.length() <= EMAIL_CONTENT_PREVIEW_LIMIT) {
            return normalized;
        }
        return normalized.substring(0, EMAIL_CONTENT_PREVIEW_LIMIT) + "...";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
