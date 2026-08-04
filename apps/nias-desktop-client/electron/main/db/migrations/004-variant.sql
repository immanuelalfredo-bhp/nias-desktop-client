CREATE TABLE IF NOT EXISTS variant_records (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	category_id TEXT NOT NULL,
	brand_id TEXT NOT NULL,
	mode_id TEXT NOT NULL,
	uom_id TEXT NOT NULL,
	description TEXT NOT NULL,
	sku_code TEXT NOT NULL UNIQUE,
	details TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
	FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE CASCADE,
	FOREIGN KEY (mode_id) REFERENCES modes (id) ON DELETE CASCADE,
	FOREIGN KEY (uom_id) REFERENCES uoms (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variant_records_item_id
	ON variant_records (item_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_category_id
	ON variant_records (category_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_brand_id
	ON variant_records (brand_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_mode_id
	ON variant_records (mode_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_uom_id
	ON variant_records (uom_id);
CREATE INDEX IF NOT EXISTS idx_variant_records_sku_code
	ON variant_records (sku_code);
CREATE INDEX IF NOT EXISTS idx_variant_records_created_at
	ON variant_records (created_at);
CREATE INDEX IF NOT EXISTS idx_variant_records_updated_at
	ON variant_records (updated_at);
CREATE INDEX IF NOT EXISTS idx_variant_records_deleted_at
	ON variant_records (deleted_at);
CREATE INDEX IF NOT EXISTS idx_variant_records_is_synced
	ON variant_records (is_synced);
CREATE INDEX IF NOT EXISTS idx_variant_records_sync_version
	ON variant_records (sync_version);

CREATE TABLE IF NOT EXISTS dimension_value_map (
	id TEXT PRIMARY KEY,
	variant_id TEXT NOT NULL,
	dimension_value_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (variant_id) REFERENCES variant_records (id) ON DELETE CASCADE,
	FOREIGN KEY (dimension_value_id) REFERENCES dimension_values (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dimension_value_map_variant_id
	ON dimension_value_map (variant_id);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_dimension_value_id
	ON dimension_value_map (dimension_value_id);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_created_at
	ON dimension_value_map (created_at);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_updated_at
	ON dimension_value_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_deleted_at
	ON dimension_value_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_is_synced
	ON dimension_value_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_dimension_value_map_sync_version
	ON dimension_value_map (sync_version);

INSERT OR IGNORE INTO
  sync_metadata (table_name, sync_version)
VALUES
  ('variant_records', 0),
  ('dimension_value_map', 0);
  