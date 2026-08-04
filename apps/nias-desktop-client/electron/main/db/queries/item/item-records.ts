import Database from 'better-sqlite3-multiple-ciphers';
import { item } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  base_name AS baseName,
  normalized_base_name AS normalizedBaseName,
  display_name AS displayName,
  normalized_display_name AS normalizedDisplayName,
  sku_source AS skuSource,
  sku_code AS skuCode,
  material_type AS materialType,
  material_class AS materialClass,
  creation_source AS creationSource,
  delimiter_type AS delimiterType,
  has_auto_assembly_trigger AS hasAutoAssemblyTrigger,
  image_url AS imageUrl,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion
`;

const SORT_ORDER = `
  CASE material_class
    WHEN 'main' THEN 1
    WHEN 'installation' THEN 2
    WHEN 'support' THEN 3
    ELSE 4
  END ASC,
  CASE creation_source
    WHEN 'system' THEN 1
    WHEN 'user' THEN 2
    ELSE 3
  END ASC,
  CASE material_type
    WHEN 'component' THEN 1
    WHEN 'assembly' THEN 2
    ELSE 3
  END ASC,
  normalized_base_name ASC,
  normalized_display_name ASC
`;

export class ItemRecordQueries extends BaseQueries<
  item.ItemRecord,
  item.CreateItemRecord,
  item.UpdateItemRecord
> {
  constructor(db: Database.Database) {
    super(db, 'item_records', COLUMNS, SORT_ORDER);
  }
  create(params: item.CreateItemRecord): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO
          item_records (
            id,
            base_name,
            normalized_base_name,
            display_name,
            normalized_display_name,
            sku_source,
            sku_code,
            material_type,
            material_class,
            creation_source,
            delimiter_type,
            has_auto_assembly_trigger,
            image_url,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @baseName,
            @normalizedBaseName,
            @displayName,
            @normalizedDisplayName,
            @skuSource,
            @skuCode,
            @materialType,
            @materialClass,
            @creationSource,
            @delimiterType,
            @hasAutoAssemblyTrigger,
            @imageUrl,
            @createdAt,
            @updatedAt
          )
      `,
      )
      .run({
        ...params,
        hasAutoAssemblyTrigger: params.hasAutoAssemblyTrigger ? 1 : 0,
        isSynced: 0,
        createdAt: now,
        updatedAt: now,
      });
  }
  update(params: item.UpdateItemRecord): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE item_records
        SET
          base_name = @baseName,
          normalized_base_name = @normalizedBaseName,
          display_name = @displayName,
          normalized_display_name = @normalizedDisplayName,
          sku_source = @skuSource,
          sku_code = @skuCode,
          material_type = @materialType,
          material_class = @materialClass,
          creation_source = @creationSource,
          delimiter_type = @delimiterType,
          has_auto_assembly_trigger = @hasAutoAssemblyTrigger,
          image_url = @imageUrl,
          updated_at = @updatedAt,
          is_synced = @isSynced
        WHERE
          id = @id
      `,
      )
      .run({
        ...existing,
        ...params,
        hasAutoAssemblyTrigger: params.hasAutoAssemblyTrigger ? 1 : 0,
        updatedAt: new Date().toISOString(),
        isSynced: 0,
      });
  }
  upsert(params: item.ItemRecord): void {
    this.db
      .prepare(
        `
        INSERT INTO
          item_records (
            id,
            base_name,
            normalized_base_name,
            display_name,
            normalized_display_name,
            sku_source,
            sku_code,
            material_type,
            material_class,
            creation_source,
            delimiter_type,
            has_auto_assembly_trigger,
            image_url,
            created_at,
            updated_at,
            deleted_at,
            is_synced,
            sync_version
          )
        VALUES
          (
            @id,
            @baseName,
            @normalizedBaseName,
            @displayName,
            @normalizedDisplayName,
            @skuSource,
            @skuCode,
            @materialType,
            @materialClass,
            @creationSource,
            @delimiterType,
            @hasAutoAssemblyTrigger,
            @imageUrl,
            @createdAt,
            @updatedAt,
            @deletedAt,
            @isSynced,
            @syncVersion
          )
        ON CONFLICT (id) DO UPDATE
        SET
          base_name = excluded.base_name,
          normalized_base_name = excluded.normalized_base_name,
          display_name = excluded.display_name,
          normalized_display_name = excluded.normalized_display_name,
          sku_source = excluded.sku_source,
          sku_code = excluded.sku_code,
          material_type = excluded.material_type,
          material_class = excluded.material_class,
          creation_source = excluded.creation_source,
          delimiter_type = excluded.delimiter_type,
          has_auto_assembly_trigger = excluded.has_auto_assembly_trigger,
          image_url = excluded.image_url,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version
      `,
      )
      .run({
        ...params,
        hasAutoAssemblyTrigger: params.hasAutoAssemblyTrigger ? 1 : 0,
        isSynced: params.isSynced ? 1 : 0,
      });
  }
  listItemCatalogue(showActive: boolean): any[] {
    return this.db
      .prepare(
        `
        SELECT
          i.id,
          i.base_name AS baseName,
          i.normalized_base_name AS normalizedBaseName,
          i.display_name AS displayName,
          i.normalized_display_name AS normalizedDisplayName,
          i.sku_source AS skuSource,
          i.sku_code AS skuCode,
          i.material_type AS materialType,
          i.material_class AS materialClass,
          i.creation_source AS creationSource,
          i.delimiter_type AS delimiterType,
          i.has_auto_assembly_trigger AS hasAutoAssemblyTrigger,
          i.image_url AS imageUrl,
          i.created_at AS createdAt,
          i.updated_at AS updatedAt,
          i.deleted_at AS deletedAt,
          i.is_synced AS isSynced,
          i.sync_version AS syncVersion,
          a.alias AS alias,
          b.name AS brand,
          s.name AS system,
          c.name AS category,
          t.name AS tag
        FROM
          item_records i
          LEFT JOIN aliases a ON i.id = a.item_id
          LEFT JOIN system_map sm ON i.id = sm.item_id
          LEFT JOIN tag_map tm ON i.id = tm.item_id
          LEFT JOIN generation_rules gr ON i.id = gr.item_id
          LEFT JOIN brands b ON gr.brand_id = b.id
          LEFT JOIN systems s ON sm.system_id = s.id
          LEFT JOIN categories c ON gr.category_id = c.id
          LEFT JOIN tags t ON tm.tag_id = t.id
        WHERE
          (i.deleted_at IS NULL) = ?
        GROUP BY
          i.id
        ORDER BY
          CASE i.material_class
            WHEN 'main' THEN 1
            WHEN 'installation' THEN 2
            WHEN 'support' THEN 3
            ELSE 4
          END ASC,
          CASE i.creation_source
            WHEN 'system' THEN 1
            WHEN 'user' THEN 2
            ELSE 3
          END ASC,
          CASE i.material_type
            WHEN 'component' THEN 1
            WHEN 'assembly' THEN 2
            ELSE 3
          END ASC,
          i.normalized_base_name ASC,
          i.normalized_display_name ASC
      `,
      )
      .all(showActive ? 1 : 0);
  }

  markPregenItemsAsSystem(id: string): void {
    this.db
      .prepare(
        `
        UPDATE item_records
        SET creation_source = 'system'
        WHERE id = @id
      `,
      )
      .run({ id });
  }
}
