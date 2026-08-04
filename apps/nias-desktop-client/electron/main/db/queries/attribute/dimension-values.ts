import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

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
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  numeric_value ASC,
  sort_order DESC,
  dimension_id ASC
`;

export class DimensionValuesQueries extends BaseQueries<
  attribute.DimensionValue,
  attribute.CreateDimensionValue,
  attribute.UpdateDimensionValue
> {
  constructor(db: Database.Database) {
    super(db, 'dimension_values', COLUMNS, SORT_ORDER);
  }
  create(params: attribute.CreateDimensionValue): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          dimension_values (
            id,
            dimension_id,
            name,
            sku_code,
            numeric_value,
            sort_order,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @dimensionId,
            @name,
            @skuCode,
            @numericValue,
            @sortOrder,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateDimensionValue): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE dimension_values
        SET
          name = @name,
          sku_code = @skuCode,
          numeric_value = @numericValue,
          sort_order = @sortOrder,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.DimensionValue): void {
    this.db
      .prepare(`
        INSERT INTO
          dimension_values (
            id,
            dimension_id,
            name,
            sku_code,
            numeric_value,
            sort_order,
            created_at,
            updated_at,
            deleted_at,
            is_synced,
            sync_version
          )
        VALUES
          (
            @id,
            @dimensionId,
            @name,
            @skuCode,
            @numericValue,
            @sortOrder,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          dimension_id = excluded.dimension_id,
          name = excluded.name,
          sku_code = excluded.sku_code,
          numeric_value = excluded.numeric_value,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  getIs(dimensionId: string, value: string | number): attribute.DimensionValue | null {
    return (
      (this.db
        .prepare(`
          SELECT
            ${this.columns}
          FROM
            ${this.tableName}
          WHERE
            dimension_id = @dimensionId
            AND (
              name = @value
              OR sku_code = @value
              OR numeric_value = @value
            )
        ORDER BY
          ${this.tableOrder}
        `)
        .get({ dimensionId, value }) as attribute.DimensionValue) || null
    );
  }
  getBetween(dimensionId: string, min: number, max: number): attribute.DimensionValue[] {
    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        WHERE
          dimension_id = @dimensionId
          AND numeric_value BETWEEN @min AND @max
        ORDER BY
          ${this.tableOrder}
      `)
      .all({ dimensionId, min, max }) as attribute.DimensionValue[];
  }
  getInclude(dimensionId: string, values: (string | number)[]): attribute.DimensionValue[] {
    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        WHERE
          dimension_id = @dimensionId
          AND (
            name IN (@values)
            OR sku_code IN (@values)
            OR numeric_value IN (@values)
          )
        ORDER BY
          ${this.tableOrder}
      `)
      .all({ dimensionId, values }) as attribute.DimensionValue[];
  }
  getActiveByDimensionId(dimensionId: string): attribute.DimensionValue[] {
    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        WHERE
          dimension_id = @dimensionId
          AND deleted_at IS NULL
        ORDER BY
          ${this.tableOrder}
      `)
      .all({ dimensionId }) as attribute.DimensionValue[];
  }
  getDeletedByDimensionId(dimensionId: string): attribute.DimensionValue[] {
    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        WHERE
          dimension_id = @dimensionId
          AND deleted_at IS NOT NULL
        ORDER BY
          ${this.tableOrder}
      `)
      .all({ dimensionId }) as attribute.DimensionValue[];
  }
  getByVariantIds(variantIds: string[]): any[] {
    return this.db
      .prepare(`
        SELECT
          dv.id,
          dv.dimension_id AS dimensionId,
          dv.name,
          dv.sku_code AS skuCode,
          dv.numeric_value AS numericValue,
          dv.sort_order AS sortOrder,
          dv.created_at AS createdAt,
          dv.updated_at AS updatedAt,
          dv.deleted_at AS deletedAt,
          dv.is_synced AS isSynced,
          dv.sync_version AS syncVersion,
          d.name AS dimensionName,
          d.position AS dimensionPosition,
          d.sort_order AS dimensionSortOrder,
          d.scope AS dimensionScope
        FROM
          dimension_values dv
        LEFT JOIN
          dimensions d ON dv.dimension_id = d.id
        WHERE
          dv.id IN (
            SELECT
              dimension_value_id
            FROM
              dimension_value_map
            WHERE
              variant_id IN (${variantIds.map((id) => `'${id}'`).join(', ')})
          )
        ORDER BY
          dv.numeric_value ASC,
          dv.sort_order DESC,
          dv.dimension_id ASC
      `)
      .all() as any[];
  }
}
