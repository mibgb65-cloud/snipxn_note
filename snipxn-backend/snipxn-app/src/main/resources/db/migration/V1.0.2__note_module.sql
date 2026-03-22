-- ============================================================
-- V3  笔记核心模块
-- 包含：user_files · folders · notes · tags · note_tags · deleted_records
-- 依赖 V2（users 表）
-- ============================================================


-- ------------------------------------------------------------
-- 1. user_files（用户文件表）
-- 图片以 BYTEA 存入 PostgreSQL，无需 OSS
-- 访问方式：GET /api/v1/files/{id}
-- 先于 folders/notes 建立，笔记内容中的图片路径引用此表 id（路径引用，无 FK）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_files (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键，同时作为访问路径标识符
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 上传者
    file_name   VARCHAR(255) NOT NULL,    -- 原始文件名，如 screenshot.png
    file_type   VARCHAR(50)  NOT NULL,    -- MIME 类型：image/jpeg / image/png / image/gif / image/webp
    file_size   BIGINT       NOT NULL,    -- 文件大小（字节），用于计算配额
    file_data   BYTEA        NOT NULL,    -- 文件二进制内容
    uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()  -- 上传时间
);

-- 用户文件列表查询 & 配额统计（SELECT SUM(file_size) WHERE user_id = ?）
CREATE INDEX IF NOT EXISTS idx_files_user ON user_files(user_id);


-- ------------------------------------------------------------
-- 2. folders（文件夹表）
-- 参与离线同步（is_deleted + version）
-- 每用户有且仅有一个 is_default=true 的默认文件夹（Inbox），不可删除
-- rank_index 使用 LexoRank 算法，支持拖拽排序
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS folders (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 所属用户
    name        VARCHAR(100) NOT NULL,                   -- 文件夹名称
    icon        VARCHAR(50)  NOT NULL DEFAULT 'folder',  -- 图标（Emoji 或内置图标 ID）
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,     -- 是否为默认文件夹（每用户唯一）
    rank_index  VARCHAR(100),                            -- LexoRank 排序字段，支持拖拽排序
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,     -- 软删除标记
    version     BIGINT       NOT NULL DEFAULT 1,         -- 乐观锁版本号，用于同步冲突检测
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),     -- 创建时间
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()      -- 最后更新时间
);

-- 文件夹列表查询（只索引未删除的，按拖拽顺序排列）
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id, rank_index)
    WHERE is_deleted = FALSE;


-- ------------------------------------------------------------
-- 3. notes（笔记表）
-- 核心业务表，参与离线同步（is_deleted + version）
-- content 存储 Markdown 原文；summary 是后端自动截取前 200 字的纯文本摘要
-- last_device_id 记录最后修改设备，用于同步冲突溯源
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 所属用户
    folder_id        UUID         NOT NULL REFERENCES folders(id),                 -- 所属文件夹（必须归属，不能为空）
    title            VARCHAR(255) NOT NULL DEFAULT '无标题笔记',                    -- 笔记标题
    content          TEXT         NOT NULL DEFAULT '',                              -- Markdown 正文
    summary          VARCHAR(200),                                                  -- 纯文本摘要，列表页展示，后端自动生成
    primary_language VARCHAR(50),                                                   -- 主编程语言，如 java / python，列表页显示图标
    is_starred       BOOLEAN      NOT NULL DEFAULT FALSE,                           -- 收藏状态
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,                           -- 回收站状态（软删除）
    status           VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',                        -- 扩展状态：NORMAL / ARCHIVED / LOCKED
    version          BIGINT       NOT NULL DEFAULT 1,                               -- 乐观锁版本号，同步冲突检测
    last_device_id   VARCHAR(100),                                                  -- 最后修改该笔记的设备 ID
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),                           -- 创建时间
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()                            -- 最后修改时间
);

-- 文件夹内笔记列表（最常用查询，按最近编辑排序）
CREATE INDEX IF NOT EXISTS idx_notes_folder  ON notes(folder_id, updated_at DESC)
    WHERE is_deleted = FALSE;
-- 全局最近编辑列表
CREATE INDEX IF NOT EXISTS idx_notes_recent  ON notes(user_id, updated_at DESC)
    WHERE is_deleted = FALSE;
-- 收藏列表
CREATE INDEX IF NOT EXISTS idx_notes_starred ON notes(user_id)
    WHERE is_starred = TRUE AND is_deleted = FALSE;
-- 回收站
CREATE INDEX IF NOT EXISTS idx_notes_trash   ON notes(user_id)
    WHERE is_deleted = TRUE;


-- ------------------------------------------------------------
-- 4. tags（标签表）
-- 用户自定义标签，参与离线同步
-- 同一用户下标签名唯一（UNIQUE user_id + name）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 所属用户
    name       VARCHAR(50) NOT NULL,    -- 标签名称
    color      VARCHAR(20),             -- 标签颜色，如 #7B3FE4
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,  -- 软删除标记
    version    BIGINT      NOT NULL DEFAULT 1,      -- 同步版本号
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 最后更新时间

    UNIQUE (user_id, name)   -- 同一用户下标签名不重复
);


-- ------------------------------------------------------------
-- 5. note_tags（笔记-标签关联表）
-- 多对多关联，联合主键天然防止重复
-- 同步时将"笔记的全部标签 ID 列表"作为整体同步，不单独同步此表行
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE, -- 关联笔记，笔记删除级联删除
    tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE, -- 关联标签，标签删除级联删除

    PRIMARY KEY (note_id, tag_id)  -- 联合主键，防止重复关联
);


-- ------------------------------------------------------------
-- 6. deleted_records（软删除记录表）
-- 专为增量同步设计：notes / folders / tags 被软删除时写入此表
-- 客户端 Pull 时查询 deleted_at > last_pulled_at，获取需本地删除的数据
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deleted_records (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),          -- 主键
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 所属用户
    table_name VARCHAR(50) NOT NULL,    -- 被删除数据所在表：notes / folders / tags
    record_id  UUID        NOT NULL,    -- 被删除记录的 ID
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 删除时间，作为同步时间游标
);

-- 增量同步查询（WHERE user_id = ? AND deleted_at > last_pulled_at）
CREATE INDEX IF NOT EXISTS idx_deleted_sync ON deleted_records(user_id, deleted_at);
