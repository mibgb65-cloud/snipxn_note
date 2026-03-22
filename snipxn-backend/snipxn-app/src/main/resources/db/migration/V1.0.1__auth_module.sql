-- ============================================================
-- V2  认证与用户模块
-- 包含：users · user_auths · user_settings · user_devices
-- ============================================================


-- ------------------------------------------------------------
-- 1. users（用户主表）
-- 存储用户基本信息，email 是唯一登录标识，status 控制账号状态
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),  -- 主键，自动生成 UUID
    email          VARCHAR(255) UNIQUE NOT NULL,                          -- 邮箱，唯一登录标识
    nickname       VARCHAR(50),                                           -- 昵称，新用户引导时填写
    avatar         VARCHAR(512),                                          -- 头像访问路径，格式 /api/v1/files/{id}
    bio            VARCHAR(200),                                          -- 一句话简介
    gender         SMALLINT     NOT NULL DEFAULT 0,                       -- 性别：0-未知 1-男 2-女
    birthday       DATE,                                                  -- 生日
    storage_limit  BIGINT       NOT NULL DEFAULT 1073741824,              -- 云空间上限，默认 1 GB（单位：字节）
    storage_used   BIGINT       NOT NULL DEFAULT 0,                       -- 已用空间（字节），上传文件时更新
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',                -- 账号状态：ACTIVE / BANNED / LOCKED
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),                   -- 注册时间
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()                    -- 最后更新时间
);

-- 邮箱查询索引（登录时按 email 查用户）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ------------------------------------------------------------
-- 2. user_auths（登录方式表）
-- 一个用户可绑定多种登录方式（密码、GitHub 等）
-- identity_type + identifier 联合唯一，防止同一账号重复绑定
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_auths (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),                      -- 主键
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,             -- 关联用户，用户删除级联删除
    identity_type  VARCHAR(20)  NOT NULL,    -- 认证类型：PASSWORD / GITHUB / WECHAT / GOOGLE
    identifier     VARCHAR(255) NOT NULL,    -- 标识符：密码登录存邮箱，第三方登录存 OpenID
    credential     VARCHAR(255),             -- 凭证：密码登录存 BCrypt Hash，第三方可为空
    bound_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- 绑定时间

    UNIQUE (identity_type, identifier)       -- 同一类型+标识不能重复绑定
);

-- 按标识符快速查找认证记录（登录时通过 email 或 OpenID 定位）
CREATE INDEX IF NOT EXISTS idx_user_auths_identifier ON user_auths(identifier);


-- ------------------------------------------------------------
-- 3. user_settings（用户偏好配置表）
-- 与 users 一对一，user_id 既是主键也是外键
-- 用 JSONB 存储灵活配置，避免频繁加列
-- preferences 示例：{"theme":"dark","language":"zh_CN","sync_only_wifi":true}
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    user_id      UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,  -- 主键同时是外键（一对一）
    preferences  JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- 偏好配置（JSONB 格式）
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()         -- 最后更新时间
);


-- ------------------------------------------------------------
-- 4. user_devices（设备 Token 表）
-- 管理多设备的 Refresh Token，支持踢下线（is_revoked = true）
-- refresh_token_hash 存 SHA-256 哈希，不存明文 Token
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 关联用户
    device_name         VARCHAR(100),          -- 设备名，如 "Chrome Web" / "Pixel 7"
    device_id           VARCHAR(100) NOT NULL,  -- 客户端生成的唯一设备指纹
    refresh_token_hash  VARCHAR(255) NOT NULL,  -- Refresh Token 的 SHA-256 哈希值（不存明文）
    expires_at          TIMESTAMPTZ  NOT NULL,  -- Token 过期时间（通常 7 天）
    last_login_ip       VARCHAR(45),            -- 最近登录 IP（支持 IPv6，最长 45 字符）
    last_login_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- 最近登录时间
    is_revoked          BOOLEAN      NOT NULL DEFAULT FALSE   -- 是否已吊销（踢下线后置 true）
);

-- 按用户+设备指纹查找 Token（刷新 Token 和踢下线时使用）
CREATE INDEX IF NOT EXISTS idx_user_devices_lookup ON user_devices(user_id, device_id);
