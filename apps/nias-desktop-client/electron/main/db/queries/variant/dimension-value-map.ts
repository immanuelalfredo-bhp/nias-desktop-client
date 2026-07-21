import Database from 'better-sqlite3-multiple-ciphers';
import { variant } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    variant_id AS variantId,
    dimension_value_id AS dimensionValueId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class DimensionValueMapQueries extends BaseQueries<
  variant.DimensionValueMap,
  variant.CreateDimensionValueMap,
  variant.UpdateDimensionValueMap
> {
  constructor(db: Database.Database) {
    super(db, 'dimension_value_map', COLUMNS);
  }
  create(params: variant.CreateDimensionValueMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO dimension_value_map (
          id, variant_id, dimension_value_id, created_at, updated_at) 
        VALUES (
          @id, @variantId, @dimensionValueId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: variant.UpdateDimensionValueMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE dimension_value_map SET 
          variant_id = @variantId, dimension_value_id = @dimensionValueId,
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: variant.DimensionValueMap): void {
    this.db
      .prepare(
        `
        INSERT INTO dimension_value_map (
          id, variant_id, dimension_value_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @variantId, @dimensionValueId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          variant_id = excluded.variant_id,
          dimension_value_id = excluded.dimension_value_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
