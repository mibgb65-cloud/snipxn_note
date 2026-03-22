package com.snipxn.common.exception;

import lombok.Getter;

/**
 * 业务异常：所有可预期的业务错误统一抛此异常
 * GlobalExceptionHandler 捕获后按 ErrorCode 返回对应响应
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /** 支持自定义消息覆盖 ErrorCode 默认消息 */
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
