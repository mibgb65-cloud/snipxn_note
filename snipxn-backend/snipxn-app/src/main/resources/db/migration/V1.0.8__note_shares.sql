-- 公开分享笔记表
CREATE TABLE IF NOT EXISTS note_shares (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id      UUID         NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL,
    share_token  VARCHAR(32)  NOT NULL UNIQUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_shares_token ON note_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_note_shares_note  ON note_shares(note_id);
