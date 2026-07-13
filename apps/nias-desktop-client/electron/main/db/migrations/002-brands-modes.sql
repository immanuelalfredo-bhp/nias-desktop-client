CREATE TABLE IF NOT EXISTS brands (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	normalized_name TEXT NOT NULL,
	sku_code TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_brands_normalized_name ON brands (normalized_name);
CREATE INDEX IF NOT EXISTS idx_brands_is_synced ON brands (is_synced);
CREATE INDEX IF NOT EXISTS idx_brands_sync_version ON brands (sync_version);
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands (deleted_at);

CREATE TABLE IF NOT EXISTS modes (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	normalized_name TEXT NOT NULL,
	sort_order NUMERIC NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modes_normalized_name ON modes (normalized_name);
CREATE INDEX IF NOT EXISTS idx_modes_sort_order ON modes (sort_order);
CREATE INDEX IF NOT EXISTS idx_modes_is_synced ON modes (is_synced);
CREATE INDEX IF NOT EXISTS idx_modes_sync_version ON modes (sync_version);
CREATE INDEX IF NOT EXISTS idx_modes_deleted_at ON modes (deleted_at);

ALTER TABLE sync_metadata ADD COLUMN brands INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_metadata ADD COLUMN modes INTEGER NOT NULL DEFAULT 0;