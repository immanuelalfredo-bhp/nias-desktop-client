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
    sync_version AS syncVersion`;

export class GenerationRulesQueries extends BaseQueries<
  item.GenerationRules,
  item.CreateGenerationRule,
  item.UpdateGenerationRule
> {
  constructor(db: Database.Database) {
    super(db, 'generation_rules', COLUMNS);
  }
  create(params: item.CreateGenerationRule): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO generation_rules (
          id, item_id, category_id, brand_id, mode_id, uom_id, rules, is_dirty, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @itemId, @categoryId, @brandId, @modeId, @uomId, @rules, @isDirty, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateGenerationRule): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE generation_rules SET 
          item_id = @itemId, category_id = @categoryId, brand_id = @brandId, mode_id = @modeId,
          uom_id = @uomId, rules = @rules, is_dirty = @isDirty, updated_at = @updatedAt,
          is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.GenerationRules): void {
    this.db
      .prepare(
        `
        INSERT INTO generation_rules (
          id, item_id, category_id, brand_id, mode_id, uom_id, rules, is_dirty, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @itemId, @categoryId, @brandId, @modeId, @uomId, @rules, @isDirty, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
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
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isDirty: params.isDirty ? 1 : 0, isSynced: params.isSynced ? 1 : 0 });
  }
}
