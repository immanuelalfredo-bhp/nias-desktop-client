import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  role_id as roleId,
  managed_role_id as managedRoleId,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RoleManagementQueries extends BaseQueries<
  system.RoleManagement,
  system.CreateRoleManagement,
  system.UpdateRoleManagement
> {
  constructor(db: Database.Database) {
    super(db, 'role_management', COLUMNS);
  }
  create(params: system.CreateRoleManagement): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO role_management (
          id, role_id, managed_role_id, created_at, updated_at) 
        VALUES (
          @id, @roleId, @managedRoleId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateRoleManagement): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE role_management SET
          role_id = @roleId, managed_role_id = @managedRoleId,
          updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.RoleManagement): void {
    this.db
      .prepare(
        `
        INSERT INTO role_management (
          id, role_id, managed_role_id, created_at, updated_at, deleted_at,
          is_synced, sync_version) 
        VALUES (
          @id, @roleId, @managedRoleId, @createdAt, @updatedAt, @deletedAt,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          role_id = excluded.role_id,
          managed_role_id = excluded.managed_role_id,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
