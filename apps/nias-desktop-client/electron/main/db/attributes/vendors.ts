import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
    id,
    name,
    normalized_name AS normalizedName,
    sku_code AS skuCode,
    sort_order AS sortOrder,
    created_at AS createdAt,
    updated_at AS updatedAt,
    deleted_at AS deletedAt,
    is_synced AS isSynced,
    sync_version AS syncVersion`;

export class VendorQueries extends BaseQueries<
  attribute.Vendor,
  attribute.CreateVendor,
  attribute.UpdateVendor
> {
  constructor(db: Database.Database) {
    super(db, 'vendors', COLUMNS);
  }
  create(params: attribute.CreateVendor): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO vendors (
          id, name, normalized_name, sku_code, sort_order, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @skuCode, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateVendor): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE vendors SET name = @name, normalized_name = @normalizedName, 
        sku_code = @skuCode, sort_order = @sortOrder, updated_at = @updatedAt WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString() });
  }
}
