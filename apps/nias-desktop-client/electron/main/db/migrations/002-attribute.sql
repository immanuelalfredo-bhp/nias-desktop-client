CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  sku_code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_brands_normalized_name ON brands (normalized_name);
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands (sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_sku_code ON brands (sku_code);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands (created_at);
CREATE INDEX IF NOT EXISTS idx_brands_updated_at ON brands (updated_at);
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands (deleted_at);
CREATE INDEX IF NOT EXISTS idx_brands_is_synced ON brands (is_synced);
CREATE INDEX IF NOT EXISTS idx_brands_sync_version ON brands (sync_version);

CREATE TABLE IF NOT EXISTS modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modes_normalized_name ON modes (normalized_name);
CREATE INDEX IF NOT EXISTS idx_modes_sort_order ON modes (sort_order);
CREATE INDEX IF NOT EXISTS idx_modes_created_at ON modes (created_at);
CREATE INDEX IF NOT EXISTS idx_modes_updated_at ON modes (updated_at);
CREATE INDEX IF NOT EXISTS idx_modes_deleted_at ON modes (deleted_at);
CREATE INDEX IF NOT EXISTS idx_modes_is_synced ON modes (is_synced);
CREATE INDEX IF NOT EXISTS idx_modes_sync_version ON modes (sync_version);

CREATE TABLE IF NOT EXISTS uoms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_uoms_normalized_name ON uoms (normalized_name);
CREATE INDEX IF NOT EXISTS idx_uoms_sort_order ON uoms (sort_order);
CREATE INDEX IF NOT EXISTS idx_uoms_created_at ON uoms (created_at);
CREATE INDEX IF NOT EXISTS idx_uoms_updated_at ON uoms (updated_at);
CREATE INDEX IF NOT EXISTS idx_uoms_deleted_at ON uoms (deleted_at);
CREATE INDEX IF NOT EXISTS idx_uoms_is_synced ON uoms (is_synced);
CREATE INDEX IF NOT EXISTS idx_uoms_sync_version ON uoms (sync_version);

CREATE TABLE IF NOT EXISTS dimensions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  form_name TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dimensions_scope ON dimensions (scope);
CREATE INDEX IF NOT EXISTS idx_dimensions_normalized_name ON dimensions (normalized_name);
CREATE INDEX IF NOT EXISTS idx_dimensions_form_name ON dimensions (form_name);
CREATE INDEX IF NOT EXISTS idx_dimensions_position ON dimensions (position);
CREATE INDEX IF NOT EXISTS idx_dimensions_sort_order ON dimensions (sort_order);
CREATE INDEX IF NOT EXISTS idx_dimensions_created_at ON dimensions (created_at);
CREATE INDEX IF NOT EXISTS idx_dimensions_updated_at ON dimensions (updated_at);
CREATE INDEX IF NOT EXISTS idx_dimensions_deleted_at ON dimensions (deleted_at);
CREATE INDEX IF NOT EXISTS idx_dimensions_is_synced ON dimensions (is_synced);
CREATE INDEX IF NOT EXISTS idx_dimensions_sync_version ON dimensions (sync_version);

CREATE TABLE IF NOT EXISTS dimension_values (
  id TEXT PRIMARY KEY,
  dimension_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku_code TEXT NOT NULL,
  numeric_value NUMERIC,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,
  
  FOREIGN KEY (dimension_id) REFERENCES dimensions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dimension_values_dimension_id ON dimension_values (dimension_id);
CREATE INDEX IF NOT EXISTS idx_dimension_values_name ON dimension_values (name);
CREATE INDEX IF NOT EXISTS idx_dimension_values_sku_code ON dimension_values (sku_code);
CREATE INDEX IF NOT EXISTS idx_dimension_values_numeric_value ON dimension_values (numeric_value);
CREATE INDEX IF NOT EXISTS idx_dimension_values_sort_order ON dimension_values (sort_order);
CREATE INDEX IF NOT EXISTS idx_dimension_values_created_at ON dimension_values (created_at);
CREATE INDEX IF NOT EXISTS idx_dimension_values_updated_at ON dimension_values (updated_at);
CREATE INDEX IF NOT EXISTS idx_dimension_values_deleted_at ON dimension_values (deleted_at);
CREATE INDEX IF NOT EXISTS idx_dimension_values_is_synced ON dimension_values (is_synced);
CREATE INDEX IF NOT EXISTS idx_dimension_values_sync_version ON dimension_values (sync_version);

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_systems_normalized_name ON systems (normalized_name);
CREATE INDEX IF NOT EXISTS idx_systems_sort_order ON systems (sort_order);
CREATE INDEX IF NOT EXISTS idx_systems_created_at ON systems (created_at);
CREATE INDEX IF NOT EXISTS idx_systems_updated_at ON systems (updated_at);
CREATE INDEX IF NOT EXISTS idx_systems_deleted_at ON systems (deleted_at);
CREATE INDEX IF NOT EXISTS idx_systems_is_synced ON systems (is_synced);
CREATE INDEX IF NOT EXISTS idx_systems_sync_version ON systems (sync_version);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_normalized_name ON categories (normalized_name);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories (created_at);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories (deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_is_synced ON categories (is_synced);
CREATE INDEX IF NOT EXISTS idx_categories_sync_version ON categories (sync_version);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sku_code TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vendors_normalized_name ON vendors (normalized_name);
CREATE INDEX IF NOT EXISTS idx_vendors_sku_code ON vendors (sku_code);
CREATE INDEX IF NOT EXISTS idx_vendors_sort_order ON vendors (sort_order);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors (created_at);
CREATE INDEX IF NOT EXISTS idx_vendors_updated_at ON vendors (updated_at);
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors (deleted_at);
CREATE INDEX IF NOT EXISTS idx_vendors_is_synced ON vendors (is_synced);
CREATE INDEX IF NOT EXISTS idx_vendors_sync_version ON vendors (sync_version);

CREATE TABLE IF NOT EXISTS vendor_map (
	id TEXT PRIMARY KEY,
	brand_id TEXT NOT NULL,
	vendor_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
	deleted_at TEXT DEFAULT NULL,
	is_synced BOOLEAN DEFAULT FALSE,
	sync_version INTEGER NOT NULL DEFAULT 0,

	FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE CASCADE,
	FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendor_map_brand_id
	ON vendor_map (brand_id);
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

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tags_normalized_name ON tags (normalized_name);
CREATE INDEX IF NOT EXISTS idx_tags_sort_order ON tags (sort_order);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags (created_at);
CREATE INDEX IF NOT EXISTS idx_tags_updated_at ON tags (updated_at);
CREATE INDEX IF NOT EXISTS idx_tags_deleted_at ON tags (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tags_is_synced ON tags (is_synced);
CREATE INDEX IF NOT EXISTS idx_tags_sync_version ON tags (sync_version);

INSERT OR IGNORE INTO
  sync_metadata (table_name, sync_version)
VALUES
  ('brands', 0),
  ('modes', 0),
  ('uoms', 0),
  ('dimensions', 0),
  ('dimension_values', 0),
  ('systems', 0),
  ('categories', 0),
  ('vendors', 0),
  ('vendor_map', 0),
  ('tags', 0);
