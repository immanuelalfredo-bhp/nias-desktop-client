import Database from 'better-sqlite3-multiple-ciphers';
import { system, attribute, item, variant, order, server } from '@nias/shared';

type SyncTableName = server.PushPayload['changes'][number]['tableName'];
import { logger } from '@nias/shared/server';
import {
  // System queries
  UserQueries,
  AuditQueries,

  // Attribute queries
  BrandQueries,
  ModeQueries,
  UomQueries,
  DimensionQueries,
  DimensionValuesQueries,
  SystemQueries,
  CategoryQueries,
  VendorQueries,
  TagQueries,

  // Item queries
  ItemRecordQueries,
  AliasQueries,
  DimensionMapQueries,
  SystemMapQueries,
  TagMapQueries,
  GenerationRulesQueries,

  // Variant queries
  VariantRecordQueries,
  DimensionValueMapQueries,
} from './index.js';

export class SyncQueries {
  constructor(private readonly db: Database.Database) {}

  getSyncVersion(): server.SyncMetadata {
    const rows = this.db.prepare('SELECT table_name, sync_version FROM sync_metadata').all() as {
      tableName: keyof server.SyncMetadata;
      syncVersion: number;
    }[];

    return rows.reduce((acc, row) => {
      if (row.tableName in acc) {
        acc[row.tableName] = row.syncVersion;
      }
      return acc;
    }, {} as server.SyncMetadata);
  }

  buildPushPayload(actorId: string): server.PushPayload {
    const changes: Array<{
      id: string;
      tableName: SyncTableName;
      payload: Record<string, unknown>;
    }> = [];

    const userQueries = new UserQueries(this.db);
    const auditQueries = new AuditQueries(this.db);
    const brandQueries = new BrandQueries(this.db);
    const modeQueries = new ModeQueries(this.db);
    const uomQueries = new UomQueries(this.db);
    const dimensionQueries = new DimensionQueries(this.db);
    const dimensionValueQueries = new DimensionValuesQueries(this.db);
    const systemQueries = new SystemQueries(this.db);
    const categoryQueries = new CategoryQueries(this.db);
    const vendorQueries = new VendorQueries(this.db);
    const tagQueries = new TagQueries(this.db);
    const itemRecordQueries = new ItemRecordQueries(this.db);
    const aliasQueries = new AliasQueries(this.db);
    const dimensionMapQueries = new DimensionMapQueries(this.db);
    const systemMapQueries = new SystemMapQueries(this.db);
    const tagMapQueries = new TagMapQueries(this.db);
    const generationRulesQueries = new GenerationRulesQueries(this.db);
    const variantRecordQueries = new VariantRecordQueries(this.db);
    const dimensionValueMapQueries = new DimensionValueMapQueries(this.db);

    const normalizePayload = <T extends Record<string, unknown>>(payload: T): T => ({
      ...payload,
      isSynced:
        typeof payload.isSynced === 'number'
          ? payload.isSynced === 1
          : payload.isSynced,
      isDirty:
        typeof payload.isDirty === 'number'
          ? payload.isDirty === 1
          : payload.isDirty,
    });

    const appendChanges = <T extends { id: string }>(tableName: SyncTableName, rows: T[]): void => {
      for (const row of rows) {
        changes.push({
          id: row.id,
          tableName,
          payload: normalizePayload(row),
        });
      }
    };

    appendChanges('users', userQueries.listDirty() as system.User[]);
    appendChanges('audit', auditQueries.listDirty() as system.Audit[]);
    appendChanges('brands', brandQueries.listDirty() as attribute.Brand[]);
    appendChanges('modes', modeQueries.listDirty() as attribute.Mode[]);
    appendChanges('uoms', uomQueries.listDirty() as attribute.Uom[]);
    appendChanges('dimensions', dimensionQueries.listDirty() as attribute.Dimension[]);
    appendChanges(
      'dimension_values',
      dimensionValueQueries.listDirty() as attribute.DimensionValue[],
    );
    appendChanges('systems', systemQueries.listDirty() as attribute.System[]);
    appendChanges('categories', categoryQueries.listDirty() as attribute.Category[]);
    appendChanges('vendors', vendorQueries.listDirty() as attribute.Vendor[]);
    appendChanges('tags', tagQueries.listDirty() as attribute.Tag[]);
    appendChanges('item_records', itemRecordQueries.listDirty() as item.ItemRecord[]);
    appendChanges('aliases', aliasQueries.listDirty() as item.Alias[]);
    appendChanges('dimension_map', dimensionMapQueries.listDirty() as item.DimensionMap[]);
    appendChanges('system_map', systemMapQueries.listDirty() as item.SystemMap[]);
    appendChanges('tag_map', tagMapQueries.listDirty() as item.TagMap[]);
    appendChanges(
      'generation_rules',
      generationRulesQueries.listDirty() as item.GenerationRules[],
    );
    appendChanges('variant_records', variantRecordQueries.listDirty() as variant.VariantRecord[]);
    appendChanges(
      'dimension_value_map',
      dimensionValueMapQueries.listDirty() as variant.DimensionValueMap[],
    );

    return {
      id: crypto.randomUUID(),
      actorId,
      changes: changes as unknown as server.PushPayload['changes'],
    };
  }

  markChangesAsSynced(payload: server.PushPayload): void {
    const changesByTable = payload.changes.reduce(
      (acc, change) => {
        if (!acc[change.tableName]) {
          acc[change.tableName] = [];
        }
        acc[change.tableName]?.push(change);
        return acc;
      },
      {} as Record<SyncTableName, typeof payload.changes>,
    );

    for (const [tableName, changes] of Object.entries(changesByTable)) {
      const targetIds = changes.map((change) => change.id);
      if (!targetIds.length) {
        continue;
      }

      const stmt = this.db.prepare(`
        UPDATE ${tableName}
        SET is_synced = 1
        WHERE id IN (${targetIds.map(() => '?').join(', ')})
      `);
      stmt.run(...targetIds);
    }
  }

  applyChanges(manifest: server.PullResponse): server.SyncMetadata {
    try {
      let nextVersions: server.SyncMetadata = this.getSyncVersion();
      const previousVersions = { ...nextVersions };

      const userQueries = new UserQueries(this.db);
      const auditQueries = new AuditQueries(this.db);
      const brandQueries = new BrandQueries(this.db);
      const modeQueries = new ModeQueries(this.db);
      const uomQueries = new UomQueries(this.db);
      const dimensionQueries = new DimensionQueries(this.db);
      const dimensionValueQueries = new DimensionValuesQueries(this.db);
      const systemQueries = new SystemQueries(this.db);
      const categoryQueries = new CategoryQueries(this.db);
      const vendorQueries = new VendorQueries(this.db);
      const tagQueries = new TagQueries(this.db);
      const itemRecordQueries = new ItemRecordQueries(this.db);
      const aliasQueries = new AliasQueries(this.db);
      const dimensionMapQueries = new DimensionMapQueries(this.db);
      const systemMapQueries = new SystemMapQueries(this.db);
      const tagMapQueries = new TagMapQueries(this.db);
      const generationRulesQueries = new GenerationRulesQueries(this.db);
      const variantRecordQueries = new VariantRecordQueries(this.db);
      const dimensionValueMapQueries = new DimensionValueMapQueries(this.db);

      const tx = this.db.transaction(() => {
        for (const user of manifest.changes.users as system.User[]) {
          userQueries.upsert(user);
        }
        for (const audit of manifest.changes.audit as system.Audit[]) {
          auditQueries.upsert(audit);
        }
        for (const brand of manifest.changes.brands as attribute.Brand[]) {
          brandQueries.upsert(brand);
        }
        for (const mode of manifest.changes.modes as attribute.Mode[]) {
          modeQueries.upsert(mode);
        }
        for (const uom of manifest.changes.uoms as attribute.Uom[]) {
          uomQueries.upsert(uom);
        }
        for (const dimension of manifest.changes.dimensions as attribute.Dimension[]) {
          dimensionQueries.upsert(dimension);
        }
        for (const dimensionValue of manifest.changes
          .dimensionValues as attribute.DimensionValue[]) {
          dimensionValueQueries.upsert(dimensionValue);
        }
        for (const system of manifest.changes.systems as attribute.System[]) {
          systemQueries.upsert(system);
        }
        for (const category of manifest.changes.categories as attribute.Category[]) {
          categoryQueries.upsert(category);
        }
        for (const vendor of manifest.changes.vendors as attribute.Vendor[]) {
          vendorQueries.upsert(vendor);
        }
        for (const tag of manifest.changes.tags as attribute.Tag[]) {
          tagQueries.upsert(tag);
        }
        for (const itemRecord of manifest.changes.itemRecords as item.ItemRecord[]) {
          itemRecordQueries.upsert(itemRecord);
        }
        for (const alias of manifest.changes.aliases as item.Alias[]) {
          aliasQueries.upsert(alias);
        }
        for (const dimensionMap of manifest.changes.dimensionMap as item.DimensionMap[]) {
          dimensionMapQueries.upsert(dimensionMap);
        }
        for (const systemMap of manifest.changes.systemMap as item.SystemMap[]) {
          systemMapQueries.upsert(systemMap);
        }
        for (const tagMap of manifest.changes.tagMap as item.TagMap[]) {
          tagMapQueries.upsert(tagMap);
        }
        for (const generationRule of manifest.changes.generationRules as item.GenerationRules[]) {
          generationRulesQueries.upsert(generationRule);
        }
        for (const variantRecord of manifest.changes.variantRecords as variant.VariantRecord[]) {
          variantRecordQueries.upsert(variantRecord);
        }
        for (const dimensionValueMap of manifest.changes
          .dimensionValueMap as variant.DimensionValueMap[]) {
          dimensionValueMapQueries.upsert(dimensionValueMap);
        }
        // Update sync versions for each table
        for (const [tableName, syncVersion] of Object.entries(manifest.latestVersions)) {
          const updateStmt = this.db.prepare(
            `UPDATE sync_metadata SET sync_version = ? WHERE table_name = ?`,
          );
          updateStmt.run(syncVersion, tableName);
          nextVersions[tableName as keyof server.SyncMetadata] = syncVersion;
        }
      });

      tx();
      return nextVersions;
    } catch (error) {
      logger.error(
        {
          scope: 'sync',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Error applying changes from sync manifest.',
      );
      throw error;
    }
  }
}
