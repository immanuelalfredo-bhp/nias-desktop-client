CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  password_hash TEXT NOT NULL,
  is_managed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_is_managed_by ON users (is_managed_by);
CREATE INDEX IF NOT EXISTS idx_users_is_synced ON users (is_synced);
CREATE INDEX IF NOT EXISTS idx_users_sync_version ON users (sync_version);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  details TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON audit (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record_id ON audit (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit (timestamp);

CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  users INTEGER NOT NULL DEFAULT 0,
  audit INTEGER NOT NULL DEFAULT 0
);

INSERT INTO
  sync_metadata (id, users, audit)
VALUES
  (1, 0, 0) ON CONFLICT DO NOTHING;
