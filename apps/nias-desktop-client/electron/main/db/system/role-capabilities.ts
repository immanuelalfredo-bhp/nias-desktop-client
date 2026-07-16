import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  role_id as roleId,
  capability,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RoleCapabilityQueries extends BaseQueries<
  system.RoleCapability,
  system.CreateRoleCapability,
  system.UpdateRoleCapability
> {
  constructor(db: Database.Database) {
    super(db, 'role_capabilities', COLUMNS);
  }
  create(params: system.CreateRoleCapability): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO role_capabilities (
          id, role_id, capability, created_at, updated_at) 
        VALUES (
          @id, @roleId, @capability, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateRoleCapability): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE role_capabilities SET
          role_id = @roleId, capability = @capability,
          updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.RoleCapability): void {
    this.db
      .prepare(
        `
        INSERT INTO role_capabilities (
          id, role_id, capability, created_at, updated_at, deleted_at,
          is_synced, sync_version) 
        VALUES (
          @id, @roleId, @capability, @createdAt, @updatedAt, @deletedAt,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          role_id = excluded.role_id,
          capability = excluded.capability,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
