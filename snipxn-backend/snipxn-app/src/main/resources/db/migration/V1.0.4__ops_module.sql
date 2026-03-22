-- ============================================================
-- V5  运维与反馈模块
-- 包含：feedbacks · app_versions
-- 依赖 V2（users）
-- ============================================================


-- ------------------------------------------------------------
-- 1. feedbacks（用户反馈表）
-- user_id 允许为 NULL，支持匿名反馈
-- images 存截图文件路径列表，格式 ["/api/v1/files/{id}"]
-- status 跟踪处理进度：PENDING → PROCESSING → RESOLVED
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,         -- 提交用户（允许为 NULL，支持匿名反馈）
    content     TEXT        NOT NULL,     -- 反馈内容
    contact     VARCHAR(100),             -- 联系方式（邮箱或手机，选填）
    images      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- 截图文件路径列表
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- 处理状态：PENDING / PROCESSING / RESOLVED
    admin_reply TEXT,                     -- 管理员回复内容
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()         -- 提交时间
);


-- ------------------------------------------------------------
-- 2. app_versions（App 版本管理表）
-- 用于 Android 客户端检查更新，支持强制升级
-- id 使用 SERIAL 自增（版本记录无需 UUID，自增更直观）
-- version_code 用于版本大小比较，version_name 用于展示
-- force_update = true 时，低于此版本的客户端必须强制升级
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_versions (
    id           SERIAL       PRIMARY KEY,            -- 主键，自增整数
    platform     VARCHAR(20)  NOT NULL,               -- 平台：ANDROID / IOS
    version_code INT          NOT NULL,               -- 内部版本号，如 102（用于比较大小）
    version_name VARCHAR(20)  NOT NULL,               -- 展示版本号，如 "1.0.2"
    download_url VARCHAR(512),                        -- APK 下载地址或应用商店链接
    update_log   TEXT,                                -- 更新日志（支持 Markdown）
    force_update BOOLEAN      NOT NULL DEFAULT FALSE, -- 是否强制更新（低于此版本必须升级）
    released_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()  -- 发布时间
);
