import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    brand_id AS brandId,
    vendor_id AS vendorId,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class VendorMapQueries extends BaseQueries<
  attribute.VendorMap,
  attribute.CreateVendorMap,
  attribute.UpdateVendorMap
> {
  constructor(db: Database.Database) {
    super(db, 'vendor_map', COLUMNS);
  }
  create(params: attribute.CreateVendorMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO vendor_map (
          id, brand_id, vendor_id, created_at, updated_at) 
        VALUES (
          @id, @brandId, @vendorId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateVendorMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE vendor_map SET 
          brand_id = @brandId, vendor_id = @vendorId, updated_at = @updatedAt,
          is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.VendorMap): void {
    this.db
      .prepare(
        `
        INSERT INTO vendor_map (
          id, brand_id, vendor_id, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @brandId, @vendorId, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          brand_id = excluded.brand_id,
          vendor_id = excluded.vendor_id,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
