import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  item_id AS itemId,
  dimension_id AS dimensionId,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  item_id ASC,
  dimension_id ASC
`;

export class DimensionMapQueries extends BaseQueries<
  item.DimensionMap,
  item.CreateDimensionMap,
  item.UpdateDimensionMap
> {
  constructor(db: Database.Database) {
    super(db, 'dimension_map', COLUMNS, SORT_ORDER);
  }
  create(params: item.CreateDimensionMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          dimension_map (id, item_id, dimension_id, created_at, updated_at)
        VALUES
          (
            @id,
            @itemId,
            @dimensionId,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateDimensionMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE dimension_map
        SET
          item_id = @itemId,
          dimension_id = @dimensionId,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.DimensionMap): void {
    this.db
      .prepare(`
        INSERT INTO
          dimension_map (
            id,
            item_id,
            dimension_id,
            created_at,
            updated_at,
            deleted_at,
            is_synced,
            sync_version
          )
        VALUES
          (
            @id,
            @itemId,
            @dimensionId,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          item_id = excluded.item_id,
          dimension_id = excluded.dimension_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  getByIds(itemId: string, dimensionId: string): item.DimensionMap | null {
    return this.db
      .prepare(`
        SELECT ${this.columns}
        FROM ${this.tableName}
        WHERE item_id = ? AND dimension_id = ?
      `)
      .get(itemId, dimensionId) as item.DimensionMap | null;
  }
}
