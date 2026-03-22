-- ============================================================
-- V1.0.7  auth 表时间列对齐
-- 1. user_auths 补齐 created_at / updated_at
-- 2. user_devices 补齐 created_at / updated_at
-- 说明：认证实体继承 BaseEntity，MyBatis Plus 会自动写入这两个字段
-- ============================================================

-- ------------------------------------------------------------
-- user_auths
-- ------------------------------------------------------------
ALTER TABLE user_auths
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE user_auths
SET created_at = COALESCE(created_at, bound_at, NOW()),
    updated_at = COALESCE(updated_at, bound_at, NOW())
WHERE created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE user_auths
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET NOT NULL;

-- ------------------------------------------------------------
-- user_devices
-- ------------------------------------------------------------
ALTER TABLE user_devices
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE user_devices
SET created_at = COALESCE(created_at, last_login_at, NOW()),
    updated_at = COALESCE(updated_at, last_login_at, NOW())
WHERE created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE user_devices
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET NOT NULL;
