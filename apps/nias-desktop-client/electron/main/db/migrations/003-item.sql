CREATE TABLE IF NOT EXISTS item_records (
	id TEXT PRIMARY KEY,
	base_name TEXT NOT NULL UNIQUE,
	normalized_base_name TEXT NOT NULL UNIQUE,
	display_name TEXT UNIQUE,
	normalized_display_name TEXT UNIQUE,
	sku_source TEXT NOT NULL,
	sku_code TEXT NOT NULL UNIQUE,
	material_type TEXT NOT NULL,
	material_class TEXT NOT NULL,
	creation_source TEXT NOT NULL,
	delimiter_type TEXT NOT NULL,
	has_auto_assembly_trigger BOOLEAN NOT NULL,
	image_url TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_item_records_normalized_base_name
	ON item_records (normalized_base_name);
CREATE INDEX IF NOT EXISTS idx_item_records_normalized_display_name
	ON item_records (normalized_display_name);
CREATE INDEX IF NOT EXISTS idx_item_records_sku_source
	ON item_records (sku_source);
CREATE INDEX IF NOT EXISTS idx_item_records_sku_code
	ON item_records (sku_code);
CREATE INDEX IF NOT EXISTS idx_item_records_material_type
	ON item_records (material_type);
CREATE INDEX IF NOT EXISTS idx_item_records_material_class
	ON item_records (material_class);
CREATE INDEX IF NOT EXISTS idx_item_records_creation_source
	ON item_records (creation_source);
CREATE INDEX IF NOT EXISTS idx_item_records_delimiter_type
	ON item_records (delimiter_type);
CREATE INDEX IF NOT EXISTS idx_item_records_has_auto_assembly_trigger
	ON item_records (has_auto_assembly_trigger);
CREATE INDEX IF NOT EXISTS idx_item_records_created_at
	ON item_records (created_at);
CREATE INDEX IF NOT EXISTS idx_item_records_updated_at
	ON item_records (updated_at);
CREATE INDEX IF NOT EXISTS idx_item_records_deleted_at
	ON item_records (deleted_at);
CREATE INDEX IF NOT EXISTS idx_item_records_is_synced
	ON item_records (is_synced);
CREATE INDEX IF NOT EXISTS idx_item_records_sync_version
	ON item_records (sync_version);

CREATE TABLE IF NOT EXISTS aliases (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	alias TEXT NOT NULL,
	normalized_alias TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aliases_item_id
	ON aliases (item_id);
CREATE INDEX IF NOT EXISTS idx_aliases_normalized_alias
	ON aliases (normalized_alias);
CREATE INDEX IF NOT EXISTS idx_aliases_created_at
	ON aliases (created_at);
CREATE INDEX IF NOT EXISTS idx_aliases_updated_at
	ON aliases (updated_at);
CREATE INDEX IF NOT EXISTS idx_aliases_deleted_at
	ON aliases (deleted_at);
CREATE INDEX IF NOT EXISTS idx_aliases_is_synced
	ON aliases (is_synced);
CREATE INDEX IF NOT EXISTS idx_aliases_sync_version
	ON aliases (sync_version);

CREATE TABLE IF NOT EXISTS dimension_map (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	dimension_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (dimension_id) REFERENCES dimensions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dimension_map_item_id
	ON dimension_map (item_id);
CREATE INDEX IF NOT EXISTS idx_dimension_map_dimension_id
	ON dimension_map (dimension_id);
CREATE INDEX IF NOT EXISTS idx_dimension_map_created_at
	ON dimension_map (created_at);
CREATE INDEX IF NOT EXISTS idx_dimension_map_updated_at
	ON dimension_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_dimension_map_deleted_at
	ON dimension_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_dimension_map_is_synced
	ON dimension_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_dimension_map_sync_version
	ON dimension_map (sync_version);

CREATE TABLE IF NOT EXISTS system_map (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	system_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (system_id) REFERENCES systems (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_system_map_item_id
	ON system_map (item_id);
CREATE INDEX IF NOT EXISTS idx_system_map_system_id
	ON system_map (system_id);
CREATE INDEX IF NOT EXISTS idx_system_map_created_at
	ON system_map (created_at);
CREATE INDEX IF NOT EXISTS idx_system_map_updated_at
	ON system_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_system_map_deleted_at
	ON system_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_system_map_is_synced
	ON system_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_system_map_sync_version
	ON system_map (sync_version);

CREATE TABLE IF NOT EXISTS brandline_map (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	brand_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_brandline_map_item_id
	ON brandline_map (item_id);
CREATE INDEX IF NOT EXISTS idx_brandline_map_brand_id
	ON brandline_map (brand_id);
CREATE INDEX IF NOT EXISTS idx_brandline_map_created_at
	ON brandline_map (created_at);
CREATE INDEX IF NOT EXISTS idx_brandline_map_updated_at
	ON brandline_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_brandline_map_deleted_at
	ON brandline_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_brandline_map_is_synced
	ON brandline_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_brandline_map_sync_version
	ON brandline_map (sync_version);

CREATE TABLE IF NOT EXISTS vendor_map (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	vendor_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendor_map_item_id
	ON vendor_map (item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_map_vendor_id
	ON vendor_map (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_map_created_at
	ON vendor_map (created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_map_updated_at
	ON vendor_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_vendor_map_deleted_at
	ON vendor_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_vendor_map_is_synced
	ON vendor_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_vendor_map_sync_version
	ON vendor_map (sync_version);

CREATE TABLE IF NOT EXISTS tag_map (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	tag_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (item_id) REFERENCES item_records (id) ON DELETE CASCADE,
	FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tag_map_item_id
	ON tag_map (item_id);
CREATE INDEX IF NOT EXISTS idx_tag_map_tag_id
	ON tag_map (tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_map_created_at
	ON tag_map (created_at);
CREATE INDEX IF NOT EXISTS idx_tag_map_updated_at
	ON tag_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_tag_map_deleted_at
	ON tag_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tag_map_is_synced
	ON tag_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_tag_map_sync_version
	ON tag_map (sync_version);

CREATE TABLE IF NOT EXISTS generation_rules (
	id TEXT PRIMARY KEY,
	item_id TEXT NOT NULL,
	category_id TEXT NOT NULL,
	brand_id TEXT NOT NULL,
	mode_id TEXT NOT NULL,
	uom_id TEXT NOT NULL,
	rules TEXT NOT NULL,
	is_dirty BOOLEAN DEFAULT TRUE,
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

CREATE INDEX IF NOT EXISTS idx_generation_rules_item_id
	ON generation_rules (item_id);
CREATE INDEX IF NOT EXISTS idx_generation_rules_category_id
	ON generation_rules (category_id);
CREATE INDEX IF NOT EXISTS idx_generation_rules_brand_id
	ON generation_rules (brand_id);
CREATE INDEX IF NOT EXISTS idx_generation_rules_mode_id
	ON generation_rules (mode_id);
CREATE INDEX IF NOT EXISTS idx_generation_rules_uom_id
	ON generation_rules (uom_id);
CREATE INDEX IF NOT EXISTS idx_generation_rules_created_at
	ON generation_rules (created_at);
CREATE INDEX IF NOT EXISTS idx_generation_rules_updated_at
	ON generation_rules (updated_at);
CREATE INDEX IF NOT EXISTS idx_generation_rules_deleted_at
	ON generation_rules (deleted_at);
CREATE INDEX IF NOT EXISTS idx_generation_rules_is_synced
	ON generation_rules (is_synced);
CREATE INDEX IF NOT EXISTS idx_generation_rules_sync_version
	ON generation_rules (sync_version);

INSERT OR IGNORE INTO
  sync_metadata (table_name, sync_version)
VALUES
  ('item_records', 0),
  ('aliases', 0),
  ('dimension_map', 0),
  ('system_map', 0),
  ('brandline_map', 0),
  ('vendor_map', 0),
  ('tag_map', 0),
  ('generation_rules', 0);
