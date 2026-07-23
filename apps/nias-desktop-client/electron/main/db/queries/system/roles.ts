import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  name,
  normalized_name as normalizedName,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RoleQueries extends BaseQueries<system.Role, system.CreateRole, system.UpdateRole> {
  constructor(db: Database.Database) {
    super(db, 'roles', COLUMNS);
  }
  create(params: system.CreateRole): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO roles (
          id, name, normalized_name, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateRole): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE roles SET
          name = @name, normalized_name = @normalizedName, updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.Role): void {
    this.db
      .prepare(
        `
        INSERT INTO roles (
          id, name, normalized_name, created_at, updated_at, deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @name, @normalizedName, @createdAt, @updatedAt, @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
