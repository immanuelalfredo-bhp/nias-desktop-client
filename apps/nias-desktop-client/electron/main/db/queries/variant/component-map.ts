import Database from 'better-sqlite3-multiple-ciphers';
import { variant } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    variant_id AS variantId,
    component_id AS componentId,
    quantity,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class ComponentMapQueries extends BaseQueries<
  variant.ComponentMap,
  variant.CreateComponentMap,
  variant.UpdateComponentMap
> {
  constructor(db: Database.Database) {
    super(db, 'component_map', COLUMNS);
  }
  create(params: variant.CreateComponentMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO component_map (
          id, variant_id, component_id, quantity, created_at, updated_at) 
        VALUES (
          @id, @variantId, @componentId, @quantity, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: variant.UpdateComponentMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE component_map SET 
          variant_id = @variantId, component_id = @componentId, quantity = @quantity,
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: variant.ComponentMap): void {
    this.db
      .prepare(
        `
        INSERT INTO component_map (
          id, variant_id, component_id, quantity, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @variantId, @componentId, @quantity, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          variant_id = excluded.variant_id,
          component_id = excluded.component_id,
          quantity = excluded.quantity,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
