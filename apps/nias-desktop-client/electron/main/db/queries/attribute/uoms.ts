import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  name,
  normalized_name AS normalizedName,
  symbol,
  sort_order AS sortOrder,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class UomQueries extends BaseQueries<
  attribute.Uom,
  attribute.CreateUom,
  attribute.UpdateUom
> {
  constructor(db: Database.Database) {
    super(db, 'uoms', COLUMNS);
  }
  create(params: attribute.CreateUom): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO uoms (
          id, name, normalized_name, symbol, sort_order, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @symbol, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateUom): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE uoms SET name = @name, normalized_name = @normalizedName, symbol = @symbol, 
        sort_order = @sortOrder, updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.Uom): void {
    this.db
      .prepare(
        `
        INSERT INTO uoms (
          id, name, normalized_name, symbol, sort_order, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @name, @normalizedName, @symbol, @sortOrder, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          symbol = excluded.symbol,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
