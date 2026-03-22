package com.snipxn.auth.service;

public interface EmailService {

    /** 发送验证码到指定邮箱（含冷却校验），验证码存入 Redis，scene 区分场景（REGISTER / RESET_PASSWORD） */
    void sendCode(String email, String scene);

    /** 校验验证码是否正确（需匹配 scene），正确后从 Redis 删除（一次性） */
    void verifyCode(String email, String code, String scene);
}
