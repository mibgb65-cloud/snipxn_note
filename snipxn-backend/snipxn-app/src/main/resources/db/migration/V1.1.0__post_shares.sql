CREATE TABLE IF NOT EXISTS post_shares (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id      UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL,
    share_token  VARCHAR(32)  NOT NULL UNIQUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_shares_token ON post_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_post_shares_post  ON post_shares(post_id);
