import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
	id,
	name,
	normalized_name AS normalizedName,
	sort_order AS sortOrder,
	created_at AS createdAt,
	updated_at AS updatedAt,
	deleted_at AS deletedAt,
	is_synced AS isSynced,
  sync_version AS syncVersion`;

export class ModeQueries extends BaseQueries<
  attribute.Mode,
  attribute.CreateMode,
  attribute.UpdateMode
> {
  constructor(db: Database.Database) {
    super(db, 'modes', COLUMNS);
  }
  create(params: attribute.CreateMode): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO modes (
          id, name, normalized_name, sort_order, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateMode): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE modes SET name = @name, normalized_name = @normalizedName, 
        sort_order = @sortOrder, updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.Mode): void {
    this.db
      .prepare(
        `
        INSERT INTO modes (
          id, name, normalized_name, sort_order, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @name, @normalizedName, @sortOrder, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
