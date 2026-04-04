export const CREATE_SYNC_META_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

export const CREATE_FOLDERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  is_default INTEGER NOT NULL DEFAULT 0,
  rank_index TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);
`;

export const CREATE_NOTES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '无标题笔记',
  content TEXT NOT NULL DEFAULT '',
  summary TEXT,
  primary_language TEXT,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NORMAL',
  version INTEGER NOT NULL DEFAULT 1,
  last_device_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);
`;

export const CREATE_IDX_NOTES_FOLDER_SQL = `
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, updated_at DESC);
`;

export const CREATE_IDX_NOTES_STARRED_SQL = `
CREATE INDEX IF NOT EXISTS idx_notes_starred ON notes(user_id)
WHERE is_starred = 1 AND is_deleted = 0;
`;

export const CREATE_IDX_NOTES_TRASH_SQL = `
CREATE INDEX IF NOT EXISTS idx_notes_trash ON notes(user_id)
WHERE is_deleted = 1;
`;

export const CREATE_TAGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  UNIQUE(user_id, name)
);
`;

export const CREATE_NOTE_TAGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);
`;

export const CREATE_PENDING_DELETES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pending_deletes (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`;

export const SCHEMA_SQL_STATEMENTS = [
  CREATE_SYNC_META_TABLE_SQL,
  CREATE_FOLDERS_TABLE_SQL,
  CREATE_NOTES_TABLE_SQL,
  CREATE_IDX_NOTES_FOLDER_SQL,
  CREATE_IDX_NOTES_STARRED_SQL,
  CREATE_IDX_NOTES_TRASH_SQL,
  CREATE_TAGS_TABLE_SQL,
  CREATE_NOTE_TAGS_TABLE_SQL,
  CREATE_PENDING_DELETES_TABLE_SQL,
] as const;
