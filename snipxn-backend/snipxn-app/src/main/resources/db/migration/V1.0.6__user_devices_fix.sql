-- ============================================================
-- V1.0.6  user_devices 安全加固
-- 1. 添加 prev_refresh_token_hash 列（Refresh Token 重放检测）
-- 2. 添加 (user_id, device_id) 唯一约束（防止并发登录插入重复设备行）
-- ============================================================

-- 1. 新增列：上一次 Refresh Token 哈希值，用于重放检测
ALTER TABLE user_devices
    ADD COLUMN IF NOT EXISTS prev_refresh_token_hash VARCHAR(255);

-- 2. 清理可能已存在的重复数据（保留最新的一条）
DELETE FROM user_devices a
    USING user_devices b
WHERE a.user_id = b.user_id
  AND a.device_id = b.device_id
  AND a.last_login_at < b.last_login_at;

-- 3. 将普通索引升级为唯一约束
DROP INDEX IF EXISTS idx_user_devices_lookup;
ALTER TABLE user_devices
    ADD CONSTRAINT uk_user_devices_user_device UNIQUE (user_id, device_id);
