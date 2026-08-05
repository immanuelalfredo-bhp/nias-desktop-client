import Database from 'better-sqlite3-multiple-ciphers';
import { variant } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  item_id AS itemId,
  category_id AS categoryId,
  brand_id AS brandId,
  mode_id AS modeId,
  uom_id AS uomId,
  dimension_value_ids AS dimensionIds,
  description,
  sku_code AS skuCode,
  details,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  item_id ASC,
  category_id ASC,
  brand_id ASC,
  mode_id ASC,
  uom_id ASC,
  description ASC
`;

export class VariantRecordQueries extends BaseQueries<
  variant.VariantRecord,
  variant.CreateVariantRecord,
  variant.UpdateVariantRecord
> {
  constructor(db: Database.Database) {
    super(db, 'variant_records', COLUMNS, SORT_ORDER);
  }
  create(params: variant.CreateVariantRecord): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          variant_records (
            id,
            item_id,
            category_id,
            brand_id,
            mode_id,
            uom_id,
            dimension_value_ids,
            description,
            sku_code,
            details,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @itemId,
            @categoryId,
            @brandId,
            @modeId,
            @uomId,
            @dimensionIds,
            @description,
            @skuCode,
            @details,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: variant.UpdateVariantRecord): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE variant_records
        SET
          item_id = @itemId,
          category_id = @categoryId,
          brand_id = @brandId,
          mode_id = @modeId,
          uom_id = @uomId,
          dimension_value_ids = @dimensionIds,
          description = @description,
          sku_code = @skuCode,
          details = @details,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: variant.VariantRecord): void {
    this.db
      .prepare(`
        INSERT INTO
          variant_records (
            id,
            item_id,
            category_id,
            brand_id,
            mode_id,
            uom_id,
            dimension_value_ids,
            description,
            sku_code,
            details,
            created_at,
            updated_at,
            deleted_at,
            is_synced,
            sync_version
          )
        VALUES
          (
            @id,
            @itemId,
            @categoryId,
            @brandId,
            @modeId,
            @uomId,
            @dimensionIds,
            @description,
            @skuCode,
            @details,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          item_id = excluded.item_id,
          category_id = excluded.category_id,
          brand_id = excluded.brand_id,
          mode_id = excluded.mode_id,
          uom_id = excluded.uom_id,
          dimension_value_ids = excluded.dimension_value_ids,
          description = excluded.description,
          sku_code = excluded.sku_code,
          details = excluded.details,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({
        ...params,
        isSynced: params.isSynced ? 1 : 0,
      });
  }
  getBySpecifications(
    itemId: string,
    brandId: string,
    modeId: string,
    uomId: string,
    dimensionValueIds: string[]
  ): variant.VariantRecord[] | null {
    const hasDimensionValues = dimensionValueIds.length > 0;

    let dimensionSql = '';
    if (hasDimensionValues) {
      const dimensionValueIdsString = dimensionValueIds.map((id) => `'${id}'`).join(', ');
      dimensionSql = `
        AND id IN (
          SELECT
            variant_id
          FROM
            dimension_value_map
          WHERE
            dimension_value_id IN (${dimensionValueIdsString})
          GROUP BY
            variant_id
          HAVING
            COUNT(DISTINCT dimension_value_id) = ${dimensionValueIds.length}
        )`;
    }

    return (
      (this.db
        .prepare(`
          SELECT
            ${this.columns}
          FROM
            ${this.tableName}
          WHERE
            item_id = @itemId
            AND brand_id = @brandId
            AND mode_id = @modeId
            AND uom_id = @uomId
            ${dimensionSql}
          ORDER BY
            ${this.tableOrder}
        `)
        .all({ itemId, brandId, modeId, uomId }) as variant.VariantRecord[]) || null
    );
  }
}
