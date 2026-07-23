CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  comments TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_requests_project_id ON requests (project_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests (user_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at);
CREATE INDEX IF NOT EXISTS idx_requests_updated_at ON requests (updated_at);
CREATE INDEX IF NOT EXISTS idx_requests_deleted_at ON requests (deleted_at);
CREATE INDEX IF NOT EXISTS idx_requests_is_synced ON requests (is_synced);
CREATE INDEX IF NOT EXISTS idx_requests_sync_version ON requests (sync_version);

CREATE TABLE IF NOT EXISTS request_items (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  comments TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (request_id) REFERENCES requests (id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES variant_records (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items (request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_variant_id ON request_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_request_items_created_at ON request_items (created_at);
CREATE INDEX IF NOT EXISTS idx_request_items_updated_at ON request_items (updated_at);
CREATE INDEX IF NOT EXISTS idx_request_items_deleted_at ON request_items (deleted_at);
CREATE INDEX IF NOT EXISTS idx_request_items_is_synced ON request_items (is_synced);
CREATE INDEX IF NOT EXISTS idx_request_items_sync_version ON request_items (sync_version);

INSERT OR IGNORE INTO
  sync_metadata (table_name, sync_version)
VALUES
  ('requests', 0),
  ('request_items', 0);
