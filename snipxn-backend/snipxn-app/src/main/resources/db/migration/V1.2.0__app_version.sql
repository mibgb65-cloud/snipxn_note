-- 应用版本发布记录表
CREATE TABLE app_version (
    id           VARCHAR(36)  NOT NULL DEFAULT uuid_generate_v4()::text PRIMARY KEY,
    platform     VARCHAR(16)  NOT NULL,
    version      VARCHAR(32)  NOT NULL,
    build_number VARCHAR(32),
    update_url   VARCHAR(512),
    release_notes TEXT,
    published_at TIMESTAMPTZ  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_version_platform_published ON app_version (platform, published_at DESC);
