import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    brandline_id AS brandlineId,
    vendor_id AS vendorId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class VendorMapQueries extends BaseQueries<
  item.VendorMap,
  item.CreateVendorMap,
  item.UpdateVendorMap
> {
  constructor(db: Database.Database) {
    super(db, 'vendor_map', COLUMNS);
  }
  create(params: item.CreateVendorMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO vendor_map (
          id, brandline_id, vendor_id, created_at, updated_at) 
        VALUES (
          @id, @brandlineId, @vendorId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateVendorMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE vendor_map SET 
          brandline_id = @brandlineId, vendor_id = @vendorId, updated_at = @updatedAt,
          is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.VendorMap): void {
    this.db
      .prepare(
        `
        INSERT INTO vendor_map (
          id, brandline_id, vendor_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @brandlineId, @vendorId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          brandline_id = excluded.brandline_id,
          vendor_id = excluded.vendor_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
