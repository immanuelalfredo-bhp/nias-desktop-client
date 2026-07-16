CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_roles_normalized_name ON roles (normalized_name);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles (created_at);
CREATE INDEX IF NOT EXISTS idx_roles_updated_at ON roles (updated_at);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles (deleted_at);
CREATE INDEX IF NOT EXISTS idx_roles_is_synced ON roles (is_synced);
CREATE INDEX IF NOT EXISTS idx_roles_sync_version ON roles (sync_version);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  so_number TEXT,
  po_number TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_projects_normalized_name ON projects (normalized_name);
CREATE INDEX IF NOT EXISTS idx_projects_so_number ON projects (so_number);
CREATE INDEX IF NOT EXISTS idx_projects_po_number ON projects (po_number);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects (updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects (deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_synced ON projects (is_synced);
CREATE INDEX IF NOT EXISTS idx_projects_sync_version ON projects (sync_version);

CREATE TABLE IF NOT EXISTS role_capabilities (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_capabilities_role_id ON role_capabilities (role_id);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_capability ON role_capabilities (capability);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_created_at ON role_capabilities (created_at);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_updated_at ON role_capabilities (updated_at);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_deleted_at ON role_capabilities (deleted_at);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_is_synced ON role_capabilities (is_synced);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_sync_version ON role_capabilities (sync_version);

CREATE TABLE IF NOT EXISTS role_management (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  managed_role_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  FOREIGN KEY (managed_role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_management_role_id ON role_management (role_id);
CREATE INDEX IF NOT EXISTS idx_role_management_managed_role_id ON role_management (managed_role_id);
CREATE INDEX IF NOT EXISTS idx_role_management_created_at ON role_management (created_at);
CREATE INDEX IF NOT EXISTS idx_role_management_updated_at ON role_management (updated_at);
CREATE INDEX IF NOT EXISTS idx_role_management_deleted_at ON role_management (deleted_at);
CREATE INDEX IF NOT EXISTS idx_role_management_is_synced ON role_management (is_synced);
CREATE INDEX IF NOT EXISTS idx_role_management_sync_version ON role_management (sync_version);

CREATE TABLE IF NOT EXISTS role_map (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_map_user_id ON role_map (user_id);
CREATE INDEX IF NOT EXISTS idx_role_map_role_id ON role_map (role_id);
CREATE INDEX IF NOT EXISTS idx_role_map_created_at ON role_map (created_at);
CREATE INDEX IF NOT EXISTS idx_role_map_updated_at ON role_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_role_map_deleted_at ON role_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_role_map_is_synced ON role_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_role_map_sync_version ON role_map (sync_version);

CREATE TABLE IF NOT EXISTS project_map (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%fZ', 'now')),
  deleted_at TEXT DEFAULT NULL,
  is_synced BOOLEAN DEFAULT FALSE,
  sync_version INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_map_user_id ON project_map (user_id);
CREATE INDEX IF NOT EXISTS idx_project_map_project_id ON project_map (project_id);
CREATE INDEX IF NOT EXISTS idx_project_map_created_at ON project_map (created_at);
CREATE INDEX IF NOT EXISTS idx_project_map_updated_at ON project_map (updated_at);
CREATE INDEX IF NOT EXISTS idx_project_map_deleted_at ON project_map (deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_map_is_synced ON project_map (is_synced);
CREATE INDEX IF NOT EXISTS idx_project_map_sync_version ON project_map (sync_version);

INSERT INTO
  sync_metadata (table_name, sync_version)
VALUES
  ('roles', 0),
  ('projects', 0),
  ('role_capabilities', 0),
  ('role_management', 0),
  ('role_map', 0),
  ('project_map', 0)
