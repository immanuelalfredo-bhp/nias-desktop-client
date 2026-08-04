import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  item_id AS itemId,
  system_id AS systemId,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  item_id ASC,
  system_id ASC
`;

export class SystemMapQueries extends BaseQueries<
  item.SystemMap,
  item.CreateSystemMap,
  item.UpdateSystemMap
> {
  constructor(db: Database.Database) {
    super(db, 'system_map', COLUMNS, SORT_ORDER);
  }
  create(params: item.CreateSystemMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          system_map (id, item_id, system_id, created_at, updated_at)
        VALUES
          (@id, @itemId, @systemId, @createdAt, @updatedAt)
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateSystemMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE system_map
        SET
          item_id = @itemId,
          system_id = @systemId,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.SystemMap): void {
    this.db
      .prepare(`
        INSERT INTO
          system_map (
            id,
            item_id,
            system_id,
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
            @systemId,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          item_id = excluded.item_id,
          system_id = excluded.system_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  getByIds(itemId: string, systemId: string): item.SystemMap | null {
    return this.db
      .prepare(`
        SELECT ${this.columns}
        FROM ${this.tableName}
        WHERE item_id = ? AND system_id = ?
      `)
      .get(itemId, systemId) as item.SystemMap | null;
  }
}
