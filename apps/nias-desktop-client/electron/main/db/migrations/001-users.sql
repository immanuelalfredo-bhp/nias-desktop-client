CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  is_managed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_is_managed_by ON users (is_managed_by);
CREATE INDEX IF NOT EXISTS idx_users_is_synced ON users (is_synced);
CREATE INDEX IF NOT EXISTS idx_users_sync_version ON users (sync_version);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);