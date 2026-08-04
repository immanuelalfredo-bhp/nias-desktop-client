import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  item_id AS itemId,
  category_id AS categoryId,
  brand_id AS brandId,
  mode_id AS modeId,
  uom_id AS uomId,
  rules,
  is_dirty AS isDirty,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  is_dirty DESC,
  item_id ASC,
  category_id ASC,
  brand_id ASC,
  mode_id ASC,
  uom_id ASC
`;

export class GenerationRulesQueries extends BaseQueries<
  item.GenerationRules,
  item.CreateGenerationRule,
  item.UpdateGenerationRule
> {
  constructor(db: Database.Database) {
    super(db, 'generation_rules', COLUMNS, SORT_ORDER);
  }
  create(params: item.CreateGenerationRule): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          generation_rules (
            id,
            item_id,
            category_id,
            brand_id,
            mode_id,
            uom_id,
            rules,
            is_dirty,
            created_at,
            updated_at,
            is_synced
          )
        VALUES
          (
            @id,
            @itemId,
            @categoryId,
            @brandId,
            @modeId,
            @uomId,
            @rules,
            @isDirty,
            @createdAt,
            @updatedAt,
            @isSynced
          )
      `)
      .run({ ...params, isDirty: 1, isSynced: 0, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateGenerationRule): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE generation_rules
        SET
          item_id = @itemId,
          category_id = @categoryId,
          brand_id = @brandId,
          mode_id = @modeId,
          uom_id = @uomId,
          rules = @rules,
          is_dirty = @isDirty,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, isDirty: 1, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.GenerationRules): void {
    this.db
      .prepare(`
        INSERT INTO
          generation_rules (
            id,
            item_id,
            category_id,
            brand_id,
            mode_id,
            uom_id,
            rules,
            is_dirty,
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
            @categoryId,
            @brandId,
            @modeId,
            @uomId,
            @rules,
            @isDirty,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          item_id = excluded.item_id,
          category_id = excluded.category_id,
          brand_id = excluded.brand_id,
          mode_id = excluded.mode_id,
          uom_id = excluded.uom_id,
          rules = excluded.rules,
          is_dirty = excluded.is_dirty,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isDirty: params.isDirty ? 1 : 0, isSynced: params.isSynced ? 1 : 0 });
  }

  listDirtyComponents(): item.GenerationRules[] {
    return this.db
      .prepare(`
        SELECT
          gr.id,
          gr.item_id AS itemId,
          gr.category_id AS categoryId,
          gr.brand_id AS brandId,
          gr.mode_id AS modeId,
          gr.uom_id AS uomId,
          gr.rules,
          gr.is_dirty AS isDirty,
          gr.created_at AS createdAt,
          gr.updated_at AS updatedAt,
          gr.deleted_at AS deletedAt,
          gr.is_synced AS isSynced,
          gr.sync_version AS syncVersion
        FROM
          ${this.tableName} gr
          JOIN item_records ON gr.item_id = item_records.id
        WHERE
          is_dirty = 1
          AND item_records.deleted_at IS NULL
          AND item_records.material_type = 'component'
      `)
      .all() as item.GenerationRules[];
  }

  listDirtyAssemblies(): item.GenerationRules[] {
    return this.db
      .prepare(`
        SELECT
          gr.id,
          gr.item_id AS itemId,
          gr.category_id AS categoryId,
          gr.brand_id AS brandId,
          gr.mode_id AS modeId,
          gr.uom_id AS uomId,
          gr.rules,
          gr.is_dirty AS isDirty,
          gr.created_at AS createdAt,
          gr.updated_at AS updatedAt,
          gr.deleted_at AS deletedAt,
          gr.is_synced AS isSynced,
          gr.sync_version AS syncVersion
        FROM
          ${this.tableName} gr
          JOIN item_records ON gr.item_id = item_records.id
        WHERE
          is_dirty = 1
          AND item_records.deleted_at IS NULL
          AND item_records.material_type = 'assembly'
      `)
      .all() as item.GenerationRules[];
  }

  // list all rules but with the item name and category name included
  listWithNames(showActive: boolean): any[] {
    return this.db
      .prepare(`
        SELECT
          gr.id,
          gr.item_id AS itemId,
          gr.category_id AS categoryId,
          gr.brand_id AS brandId,
          gr.mode_id AS modeId,
          gr.uom_id AS uomId,
          gr.rules,
          gr.is_dirty AS isDirty,
          gr.created_at AS createdAt,
          gr.updated_at AS updatedAt,
          gr.deleted_at AS deletedAt,
          gr.is_synced AS isSynced,
          gr.sync_version AS syncVersion,
          i.display_name AS itemName,
          c.name AS categoryName,
          b.name AS brandName,
          m.name AS modeName,
          u.name AS uomName
        FROM
          generation_rules gr
          JOIN item_records i ON gr.item_id = i.id
          JOIN categories c ON gr.category_id = c.id
          JOIN brands b ON gr.brand_id = b.id
          JOIN modes m ON gr.mode_id = m.id
          JOIN uoms u ON gr.uom_id = u.id
        WHERE
          (gr.deleted_at IS NULL) = ?
          AND i.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND b.deleted_at IS NULL
          AND m.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ORDER BY
          i.display_name ASC,
          c.normalized_name ASC,
          b.normalized_name ASC,
          m.normalized_name ASC,
          u.normalized_name ASC
      `)
      .all(showActive ? 1 : 0);
  }

  markAsClean(id: string): void {
    this.db
      .prepare(`
        UPDATE
          ${this.tableName}
        SET
          is_dirty = 0
        WHERE
          id = @id
      `)
      .run({ id });
  }
}
