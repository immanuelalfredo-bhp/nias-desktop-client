CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_users_is_managed_by ON users (is_managed_by);
CREATE INDEX IF NOT EXISTS idx_users_is_synced ON users (is_synced);
CREATE INDEX IF NOT EXISTS idx_users_sync_version ON users (sync_version);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  users INTEGER NOT NULL DEFAULT 0
);

INSERT INTO sync_metadata (id, users) VALUES (1, 0) ON CONFLICT DO NOTHING;