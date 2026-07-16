import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
    id,
    item_id AS itemId,
    dimension_id AS dimensionId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class DimensionMapQueries extends BaseQueries<
  item.DimensionMap,
  item.CreateDimensionMap,
  item.UpdateDimensionMap
> {
  constructor(db: Database.Database) {
    super(db, 'dimension_maps', COLUMNS);
  }
  create(params: item.CreateDimensionMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO dimension_maps (
          id, item_id, dimension_id, created_at, updated_at) 
        VALUES (
          @id, @itemId, @dimensionId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateDimensionMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE dimension_maps SET 
          item_id = @itemId, dimension_id = @dimensionId, updated_at = @updatedAt,
          is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.DimensionMap): void {
    this.db
      .prepare(
        `
        INSERT INTO dimension_maps (
          id, item_id, dimension_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @itemId, @dimensionId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          item_id = excluded.item_id,
          dimension_id = excluded.dimension_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
