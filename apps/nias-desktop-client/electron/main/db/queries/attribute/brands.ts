import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

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
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  sort_order DESC,
  normalized_name ASC
`;

export class BrandQueries extends BaseQueries<
  attribute.Brand,
  attribute.CreateBrand,
  attribute.UpdateBrand
> {
  constructor(db: Database.Database) {
    super(db, 'brands', COLUMNS, SORT_ORDER);
  }
  create(params: attribute.CreateBrand): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          brands (
            id,
            name,
            normalized_name,
            sku_code,
            sort_order,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @name,
            @normalizedName,
            @skuCode,
            @sortOrder,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateBrand): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE brands
        SET
          name = @name,
          normalized_name = @normalizedName,
          sku_code = @skuCode,
          sort_order = @sortOrder,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.Brand): void {
    this.db
      .prepare(`
        INSERT INTO
          brands (
            id,
            name,
            normalized_name,
            sku_code,
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
            @name,
            @normalizedName,
            @skuCode,
            @sortOrder,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          sku_code = excluded.sku_code,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }

  getByItemId(itemId: string): attribute.Brand[] | null {
    return this.db
      .prepare(`
        SELECT
          b.id,
          b.name,
          b.normalized_name AS normalizedName,
          b.sku_code AS skuCode,
          b.sort_order AS sortOrder,
          b.created_at AS createdAt,
          b.updated_at AS updatedAt,
          b.deleted_at AS deletedAt,
          b.is_synced AS isSynced,
          b.sync_version AS syncVersion
        FROM
          brands b
        LEFT JOIN
          generation_rules gr ON b.id = gr.brand_id
        WHERE
          gr.item_id = @itemId
          AND b.deleted_at IS NULL
          AND gr.deleted_at IS NULL
        GROUP BY
          b.id
      `)
      .all({ itemId }) as attribute.Brand[];
  }
}
