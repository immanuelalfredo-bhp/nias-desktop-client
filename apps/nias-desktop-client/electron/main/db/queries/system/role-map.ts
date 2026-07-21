import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  user_id as userId,
  role_id as roleId,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RoleMapQueries extends BaseQueries<
  system.RoleMap,
  system.CreateRoleMap,
  system.UpdateRoleMap
> {
  constructor(db: Database.Database) {
    super(db, 'role_map', COLUMNS);
  }
  create(params: system.CreateRoleMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO role_map (
          id, user_id, role_id, created_at, updated_at) 
        VALUES (
          @id, @userId, @roleId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateRoleMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE role_map SET
          user_id = @userId, role_id = @roleId,
          updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.RoleMap): void {
    this.db
      .prepare(
        `
        INSERT INTO role_map (
          id, user_id, role_id, created_at, updated_at, deleted_at,
          is_synced, sync_version) 
        VALUES (
          @id, @userId, @roleId, @createdAt, @updatedAt, @deletedAt,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          role_id = excluded.role_id,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
