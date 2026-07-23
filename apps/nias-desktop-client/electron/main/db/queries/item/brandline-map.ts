import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    item_id AS itemId,
    brand_id AS brandId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class BrandlineMapQueries extends BaseQueries<
  item.BrandlineMap,
  item.CreateBrandlineMap,
  item.UpdateBrandlineMap
> {
  constructor(db: Database.Database) {
    super(db, 'brandline_map', COLUMNS);
  }
  create(params: item.CreateBrandlineMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO brandline_map (
          id, item_id, brand_id, created_at, updated_at) 
        VALUES (
          @id, @itemId, @brandId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateBrandlineMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE brandline_map SET 
          item_id = @itemId, brand_id = @brandId, updated_at = @updatedAt,
          is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.BrandlineMap): void {
    this.db
      .prepare(
        `
        INSERT INTO brandline_map (
          id, item_id, brand_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @itemId, @brandId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          item_id = excluded.item_id,
          brand_id = excluded.brand_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
