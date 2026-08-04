CREATE TABLE IF NOT EXISTS provisional_request (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total NUMERIC NOT NULL,
  comments TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,

  FOREIGN KEY (variant_id) REFERENCES variant_records (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_provisional_request_variant_id ON provisional_request (variant_id);
CREATE INDEX IF NOT EXISTS idx_provisional_request_created_at ON provisional_request (created_at);
CREATE INDEX IF NOT EXISTS idx_provisional_request_updated_at ON provisional_request (updated_at);
CREATE INDEX IF NOT EXISTS idx_provisional_request_deleted_at ON provisional_request (deleted_at);