import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  display_name AS displayName,
  email,
  password_hash AS passwordHash,
  is_managed_by AS isManagedBy,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class UserQueries extends BaseQueries<system.User, system.CreateUser, system.UpdateUser> {
  constructor(db: Database.Database) {
    super(db, 'users', COLUMNS);
  }
  create(params: system.CreateUser): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO users (
          id, display_name, email, password_hash, is_managed_by, created_at, updated_at) 
        VALUES (
          @id, @displayName, @email, @passwordHash, @isManagedBy, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateUser): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE users SET display_name = @displayName, email = @email, password_hash = @passwordHash, 
        is_managed_by = @isManagedBy, updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.User): void {
    this.db
      .prepare(
        `
        INSERT INTO users (
          id, display_name, email, password_hash, is_managed_by, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @displayName, @email, @passwordHash, @isManagedBy, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          display_name = excluded.display_name,
          email = excluded.email,
          password_hash = excluded.password_hash,
          is_managed_by = excluded.is_managed_by,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
