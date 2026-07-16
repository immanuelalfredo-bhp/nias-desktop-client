import Database from 'better-sqlite3-multiple-ciphers';
import { variant } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
    id,
    variant_id AS variantId,
    assembly_id AS assemblyId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class SwitchMapQueries extends BaseQueries<
  variant.SwitchMap,
  variant.CreateSwitchMap,
  variant.UpdateSwitchMap
> {
  constructor(db: Database.Database) {
    super(db, 'switch_map', COLUMNS);
  }
  create(params: variant.CreateSwitchMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO switch_map (
          id, variant_id, assembly_id, created_at, updated_at) 
        VALUES (
          @id, @variantId, @assemblyId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: variant.UpdateSwitchMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE switch_map SET 
          variant_id = @variantId, assembly_id = @assemblyId,
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: variant.SwitchMap): void {
    this.db
      .prepare(
        `
        INSERT INTO switch_map (
          id, variant_id, assembly_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @variantId, @assemblyId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          variant_id = excluded.variant_id,
          assembly_id = excluded.assembly_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
