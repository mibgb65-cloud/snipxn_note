package com.snipxn.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 业务错误码枚举
 * 规范：HTTP 状态码对齐，code 与 HTTP status 保持一致
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ── 通用 ──────────────────────────────────────────────
    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或 Token 已过期"),
    FORBIDDEN(403, "无权限执行此操作"),
    NOT_FOUND(404, "资源不存在"),
    CONFLICT(409, "数据冲突"),
    TOO_MANY_REQUESTS(429, "请求过于频繁，请稍后再试"),
    INTERNAL_ERROR(500, "服务器内部错误"),

    // ── 认证模块 ──────────────────────────────────────────
    EMAIL_ALREADY_EXISTS(409, "该邮箱已被注册"),
    EMAIL_CODE_INVALID(400, "验证码错误或已过期"),
    EMAIL_CODE_TOO_FREQUENT(429, "发送验证码过于频繁，请稍后再试"),
    EMAIL_CODE_VERIFY_LOCKED(429, "验证码错误次数过多，请稍后重新获取"),
    PASSWORD_WRONG(401, "密码错误"),
    LOGIN_ATTEMPTS_LOCKED(429, "登录失败次数过多，请 15 分钟后再试"),
    ACCOUNT_BANNED(403, "账号已被封禁"),
    ACCOUNT_LOCKED(403, "账号已被锁定"),
    TOKEN_INVALID(401, "Token 无效"),
    TOKEN_REVOKED(401, "Token 已被吊销，请重新登录"),
    DEVICE_NOT_FOUND(404, "设备不存在"),

    // ── 笔记模块 ──────────────────────────────────────────
    NOTE_NOT_FOUND(404, "笔记不存在"),
    FOLDER_NOT_FOUND(404, "文件夹不存在"),
    FOLDER_DEFAULT_DELETE(403, "默认文件夹不可删除"),
    TAG_NOT_FOUND(404, "标签不存在"),
    TAG_NAME_DUPLICATE(409, "标签名称已存在"),
    SYNC_VERSION_CONFLICT(409, "数据版本冲突，请重新拉取后再提交"),
    STORAGE_LIMIT_EXCEEDED(403, "云空间已满，请删除部分文件后再试"),
    FILE_NOT_FOUND(404, "文件不存在"),
    FILE_TYPE_NOT_SUPPORTED(400, "不支持的文件类型"),
    IMPORT_FILE_EMPTY(400, "导入文件不能为空"),
    IMPORT_FILE_TYPE_INVALID(400, "仅支持导入 .md 文件"),
    IMPORT_FILE_TOO_LARGE(400, "单个文件不能超过 2MB"),
    IMPORT_FILE_TOO_MANY(400, "单次最多导入 20 个文件"),

    // ── 社区模块 ──────────────────────────────────────────
    POST_NOT_FOUND(404, "帖子不存在"),
    POST_ALREADY_LIKED(409, "已经点赞过了"),
    POST_ALREADY_COLLECTED(409, "已经收藏过了"),
    FOLLOW_SELF(400, "不能关注自己"),
    ALREADY_FOLLOWED(409, "已经关注过了"),

    // ── 沙箱模块 ──────────────────────────────────────────
    SANDBOX_LANGUAGE_NOT_SUPPORTED(400, "不支持的编程语言"),
    SANDBOX_EXECUTION_FAILED(500, "代码执行服务异常");

    /** HTTP 状态码 */
    private final int code;
    /** 错误描述 */
    private final String message;
}
