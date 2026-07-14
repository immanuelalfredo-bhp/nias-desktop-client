import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  dimension_id AS dimensionId,
  name,
  sku_code AS skuCode,
  numeric_value AS numericValue,
  sort_order AS sortOrder,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class DimensionValuesQueries extends BaseQueries<
  attribute.DimensionValue,
  attribute.CreateDimensionValue,
  attribute.UpdateDimensionValue
> {
  constructor(db: Database.Database) {
    super(db, 'dimension_values', COLUMNS);
  }
  create(params: attribute.CreateDimensionValue): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO dimension_values (
          id, dimension_id, name, sku_code, numeric_value, sort_order, created_at, updated_at) 
        VALUES (
          @id, @dimensionId, @name, @skuCode, @numericValue, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateDimensionValue): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE dimension_values SET 
          name = @name, sku_code = @skuCode, numeric_value = @numericValue, 
          sort_order = @sortOrder, updated_at = @updatedAt WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString() });
  }
}
