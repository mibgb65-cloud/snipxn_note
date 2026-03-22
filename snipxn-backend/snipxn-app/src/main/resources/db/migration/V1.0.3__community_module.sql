-- ============================================================
-- V4  社区模块
-- 包含：posts · user_follows · interactions
-- 依赖 V2（users）、V3（notes）
-- ============================================================


-- ------------------------------------------------------------
-- 1. posts（社区帖子表）
-- 帖子是私有笔记内容的公开快照，发布后 content 不随原笔记变化
-- view_count 由 RabbitMQ 消费者异步批量更新，避免高并发写冲突
-- origin_note_id 允许为空（笔记被删除后置 NULL，帖子内容仍保留快照）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),                   -- 主键
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,          -- 作者
    origin_note_id UUID         REFERENCES notes(id) ON DELETE SET NULL,                  -- 关联的私有笔记（可为空，笔记删除后置 NULL）
    title          VARCHAR(255) NOT NULL,                        -- 帖子标题
    content        TEXT         NOT NULL,                        -- 发布时的 Markdown 内容快照
    language       VARCHAR(50),                                  -- 编程语言分类，如 Java / Python
    tags           JSONB        NOT NULL DEFAULT '[]'::jsonb,   -- 标签列表，如 ["React", "CSS"]
    view_count     BIGINT       NOT NULL DEFAULT 0,              -- 浏览量，MQ 异步更新
    like_count     BIGINT       NOT NULL DEFAULT 0,              -- 点赞数
    collect_count  BIGINT       NOT NULL DEFAULT 0,              -- 收藏数
    comment_count  BIGINT       NOT NULL DEFAULT 0,              -- 评论数（预留）
    status         VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',    -- 状态：PUBLISHED / HIDDEN
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),          -- 发布时间
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()           -- 最后更新时间
);

-- 最新 Feed 流（首页按发布时间倒序）
CREATE INDEX IF NOT EXISTS idx_posts_latest   ON posts(created_at DESC)
    WHERE status = 'PUBLISHED';
-- 热门榜单（按浏览量、点赞数排序）
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(view_count DESC, like_count DESC)
    WHERE status = 'PUBLISHED';
-- 某用户的所有帖子（个人主页）
CREATE INDEX IF NOT EXISTS idx_posts_user     ON posts(user_id, created_at DESC);


-- ------------------------------------------------------------
-- 2. user_follows（关注关系表）
-- 联合主键天然防止重复关注
-- CHECK 约束禁止关注自己
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 粉丝（发起关注的人）
    following_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 博主（被关注的人）
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),                            -- 关注时间

    PRIMARY KEY (follower_id, following_id),

    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)  -- 不能关注自己
);

-- 查"我关注了谁"（关注列表）
CREATE INDEX IF NOT EXISTS idx_follows_follower  ON user_follows(follower_id);
-- 查"谁关注了我"（粉丝列表 & 粉丝数统计）
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);


-- ------------------------------------------------------------
-- 3. interactions（互动记录表）
-- 统一存储点赞（LIKE）和收藏（COLLECT）行为
-- UNIQUE (user_id, target_id, action_type) 防止重复操作
-- target_type 预留扩展字段（当前为 POST，后续可扩展 COMMENT）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interactions (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 操作用户
    target_id   UUID        NOT NULL,    -- 目标 ID（帖子 ID 等）
    target_type VARCHAR(20) NOT NULL,    -- 目标类型：POST（预留扩展 COMMENT）
    action_type VARCHAR(20) NOT NULL,    -- 操作类型：LIKE / COLLECT
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 操作时间

    UNIQUE (user_id, target_id, action_type)  -- 同一用户对同一目标只能点赞/收藏一次
);

-- 查某用户是否已对某帖子点赞/收藏（状态查询）
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id, target_id, action_type);
