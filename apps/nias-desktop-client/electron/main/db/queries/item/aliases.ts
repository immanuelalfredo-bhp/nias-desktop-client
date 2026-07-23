import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    item_id AS itemId,
    alias,
    normalized_alias AS normalizedAlias,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class AliasQueries extends BaseQueries<item.Alias, item.CreateAlias, item.UpdateAlias> {
  constructor(db: Database.Database) {
    super(db, 'aliases', COLUMNS);
  }
  create(params: item.CreateAlias): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO aliases (
          id, item_id, alias, normalized_alias, created_at, updated_at) 
        VALUES (
          @id, @itemId, @alias, @normalizedAlias, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateAlias): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE aliases SET 
          item_id = @itemId, alias = @alias, normalized_alias = @normalizedAlias, 
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.Alias): void {
    this.db
      .prepare(
        `
        INSERT INTO aliases (
          id, item_id, alias, normalized_alias, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @itemId, @alias, @normalizedAlias, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          item_id = excluded.item_id,
          alias = excluded.alias,
          normalized_alias = excluded.normalized_alias,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
