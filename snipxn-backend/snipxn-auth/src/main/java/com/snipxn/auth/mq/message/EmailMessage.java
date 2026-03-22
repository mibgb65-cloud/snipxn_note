package com.snipxn.auth.mq.message;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

@Data
@NoArgsConstructor
public class EmailMessage implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String to;
    private String subject;
    /** 兼容旧消息体，作为纯文本 fallback 使用 */
    private String content;
    private String htmlContent;

    public EmailMessage(String to, String subject, String content) {
        this.to = to;
        this.subject = subject;
        this.content = content;
    }

    public EmailMessage(String to, String subject, String content, String htmlContent) {
        this.to = to;
        this.subject = subject;
        this.content = content;
        this.htmlContent = htmlContent;
    }
}
