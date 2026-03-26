-- ============================================================
-- V1.0.9  社区评论 & 分享计数
-- 新增：comments 表、posts.share_count 列
-- ============================================================

-- 1. posts 表增加 share_count
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count BIGINT NOT NULL DEFAULT 0;

-- 2. comments（评论表，支持二级嵌套）
CREATE TABLE IF NOT EXISTS comments (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id       UUID         REFERENCES comments(id) ON DELETE CASCADE,   -- NULL = 顶级评论
    reply_to_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,    -- 回复对象（@某人），NULL = 普通评论
    content         TEXT         NOT NULL,
    like_count  BIGINT       NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'VISIBLE',                  -- VISIBLE / HIDDEN / DELETED
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 按帖子分页查顶级评论（parent_id IS NULL）
CREATE INDEX IF NOT EXISTS idx_comments_post_top
    ON comments(post_id, created_at DESC) WHERE parent_id IS NULL AND status = 'VISIBLE';

-- 按父评论查回复
CREATE INDEX IF NOT EXISTS idx_comments_parent
    ON comments(parent_id, created_at ASC) WHERE status = 'VISIBLE';

-- 按用户查评论历史
CREATE INDEX IF NOT EXISTS idx_comments_user
    ON comments(user_id, created_at DESC);
