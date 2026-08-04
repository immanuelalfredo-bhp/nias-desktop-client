import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  scope,
  name,
  normalized_name AS normalizedName,
  display_name AS displayName,
  form_name AS formName,
  position,
  sort_order AS sortOrder,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  CASE position
    WHEN 'prefix' THEN 1
    WHEN 'suffix' THEN 2
    WHEN 'dimensions' THEN 3
    WHEN 'end' THEN 4
    ELSE 5
  END ASC,
  scope ASC,
  sort_order DESC,
  normalized_name ASC
`;

export class DimensionQueries extends BaseQueries<
  attribute.Dimension,
  attribute.CreateDimension,
  attribute.UpdateDimension
> {
  constructor(db: Database.Database) {
    super(db, 'dimensions', COLUMNS, SORT_ORDER);
  }
  create(params: attribute.CreateDimension): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          dimensions (
            id,
            scope,
            name,
            normalized_name,
            display_name,
            form_name,
            position,
            sort_order,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @scope,
            @name,
            @normalizedName,
            @displayName,
            @formName,
            @position,
            @sortOrder,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateDimension): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE dimensions
        SET
          name = @name,
          normalized_name = @normalizedName,
          display_name = @displayName,
          form_name = @formName,
          position = @position,
          sort_order = @sortOrder,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.Dimension): void {
    this.db
      .prepare(`
        INSERT INTO
          dimensions (
            id,
            scope,
            name,
            normalized_name,
            display_name,
            form_name,
            position,
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
            @scope,
            @name,
            @normalizedName,
            @displayName,
            @formName,
            @position,
            @sortOrder,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          scope = excluded.scope,
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          display_name = excluded.display_name,
          form_name = excluded.form_name,
          position = excluded.position,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `)
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  getByNorm(normalizedName: string): attribute.Dimension | null {
    return (
      (this.db
        .prepare(`
          SELECT
            ${this.columns}
          FROM
            ${this.tableName}
          WHERE
            normalized_name = ?
        `)
        .get(normalizedName) as attribute.Dimension) || null
    );
  }
  getByItemId(itemId: string): attribute.Dimension[] | null {
    return (
      (this.db
        .prepare(`
          SELECT
            ${this.columns}
          FROM
            ${this.tableName}
          WHERE
            id IN (
              SELECT
                dimension_id
              FROM
                dimension_map
              WHERE
                item_id = ?
                AND deleted_at IS NULL
            )
            AND deleted_at IS NULL
          ORDER BY
            ${this.tableOrder}
        `)
        .all(itemId) as attribute.Dimension[]) || null
    );
  }
}
