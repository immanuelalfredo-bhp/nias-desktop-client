import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  item_id AS itemId,
  tag_id AS tagId,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  item_id ASC,
  tag_id ASC
`;

export class TagMapQueries extends BaseQueries<item.TagMap, item.CreateTagMap, item.UpdateTagMap> {
  constructor(db: Database.Database) {
    super(db, 'tag_map', COLUMNS, SORT_ORDER);
  }
  create(params: item.CreateTagMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          tag_map (id, item_id, tag_id, created_at, updated_at)
        VALUES
          (@id, @itemId, @tagId, @createdAt, @updatedAt)
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateTagMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE tag_map
        SET
          item_id = @itemId,
          tag_id = @tagId,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.TagMap): void {
    this.db
      .prepare(`
        INSERT INTO
          tag_map (
            id,
            item_id,
            tag_id,
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
            @tagId,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          item_id = excluded.item_id,
          tag_id = excluded.tag_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  getByIds(itemId: string, tagId: string): item.TagMap | null {
    return this.db
      .prepare(`
        SELECT ${this.columns}
        FROM ${this.tableName}
        WHERE item_id = ? AND tag_id = ?
      `)
      .get(itemId, tagId) as item.TagMap | null;
  }
}
