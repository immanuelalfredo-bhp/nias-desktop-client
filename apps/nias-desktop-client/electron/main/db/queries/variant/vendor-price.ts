import Database from 'better-sqlite3-multiple-ciphers';
import { variant } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
    id,
    variant_id as variantId,
    vendor_id as vendorId,
    original_price as originalPrice,
    discounted_price as discountedPrice,
    discount_rate as discountRate,
    effective_date as effectiveDate,
    expiration_date as expirationDate,
    is_synced as isSynced,
    sync_version as syncVersion`;

export class VendorPriceQueries extends BaseQueries<
  variant.VendorPrice,
  variant.CreateVendorPrice,
  variant.UpdateVendorPrice
> {
  constructor(db: Database.Database) {
    super(db, 'vendor_prices', COLUMNS);
  }
  create(params: variant.CreateVendorPrice): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO vendor_prices (
          id, variant_id, vendor_id, original_price, discounted_price, discount_rate,
          effective_date, expiration_date, created_at, updated_at) 
        VALUES (
          @id, @variantId, @vendorId, @originalPrice, @discountedPrice, @discountRate,
          @effectiveDate, @expirationDate, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: variant.UpdateVendorPrice): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE vendor_prices SET 
          variant_id = @variantId, vendor_id = @vendorId, original_price = @originalPrice,
          discounted_price = @discountedPrice, discount_rate = @discountRate,
          effective_date = @effectiveDate, expiration_date = @expirationDate,
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: variant.VendorPrice): void {
    this.db
      .prepare(
        `
        INSERT INTO vendor_prices (
          id, variant_id, vendor_id, original_price, discounted_price, discount_rate,
          effective_date, expiration_date, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @variantId, @vendorId, @originalPrice, @discountedPrice, @discountRate,
          @effectiveDate, @expirationDate, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          variant_id = excluded.variant_id,
          vendor_id = excluded.vendor_id,
          original_price = excluded.original_price,
          discounted_price = excluded.discounted_price,
          discount_rate = excluded.discount_rate,
          effective_date = excluded.effective_date,
          expiration_date = excluded.expiration_date,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
