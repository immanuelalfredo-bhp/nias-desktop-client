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
    sync_version AS syncVersion`;

export class ItemRecordQueries extends BaseQueries<
  item.ItemRecord,
  item.CreateItemRecord,
  item.UpdateItemRecord
> {
  constructor(db: Database.Database) {
    super(db, 'item_records', COLUMNS);
  }
  create(params: item.CreateItemRecord): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO item_records (
          id, base_name, normalized_base_name, display_name, normalized_display_name, sku_source,
          sku_code, material_type, material_class, creation_source, delimiter_type,
          has_auto_assembly_trigger, image_url, created_at, updated_at) 
        VALUES (
          @id, @baseName, @normalizedBaseName, @displayName, @normalizedDisplayName, @skuSource,
          @skuCode, @materialType, @materialClass, @creationSource, @delimiterType,
          @hasAutoAssemblyTrigger, @imageUrl, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: item.UpdateItemRecord): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE item_records SET 
          base_name = @baseName, normalized_base_name = @normalizedBaseName, display_name = @displayName, 
          normalized_display_name = @normalizedDisplayName, sku_source = @skuSource, sku_code = @skuCode, 
          material_type = @materialType, material_class = @materialClass, creation_source = @creationSource, 
          delimiter_type = @delimiterType, has_auto_assembly_trigger = @hasAutoAssemblyTrigger, 
          image_url = @imageUrl, updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: item.ItemRecord): void {
    this.db
      .prepare(
        `
        INSERT INTO item_records (
          id, base_name, normalized_base_name, display_name, normalized_display_name, sku_source,
          sku_code, material_type, material_class, creation_source, delimiter_type,
          has_auto_assembly_trigger, image_url, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @baseName, @normalizedBaseName, @displayName, @normalizedDisplayName, @skuSource,
          @skuCode, @materialType, @materialClass, @creationSource, @delimiterType,
          @hasAutoAssemblyTrigger, @imageUrl, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
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
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
