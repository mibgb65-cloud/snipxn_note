package com.snipxn.common.result;

import com.snipxn.common.exception.ErrorCode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

/**
 * 统一响应体
 * 成功：code=200，data 携带业务数据
 * 失败：code=ErrorCode.code，message 携带错误描述，data=null
 */
@Getter
@Schema(name = "Result", description = "统一响应体，业务数据放在 data 字段中")
public class Result<T> {

    @Schema(description = "业务状态码，200 表示成功，其余值表示业务失败", example = "200")
    private final int code;
    @Schema(description = "业务结果说明", example = "success")
    private final String message;
    @Schema(description = "业务响应数据；无数据时为 null")
    private final T data;

    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> Result<T> success() {
        return new Result<>(ErrorCode.SUCCESS.getCode(), ErrorCode.SUCCESS.getMessage(), null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(ErrorCode.SUCCESS.getCode(), ErrorCode.SUCCESS.getMessage(), data);
    }

    public static <T> Result<T> fail(ErrorCode errorCode) {
        return new Result<>(errorCode.getCode(), errorCode.getMessage(), null);
    }

    public static <T> Result<T> fail(ErrorCode errorCode, String message) {
        return new Result<>(errorCode.getCode(), message, null);
    }
}
