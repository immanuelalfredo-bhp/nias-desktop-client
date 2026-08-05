import Database from 'better-sqlite3-multiple-ciphers';
import { system, attribute, item, variant, order, server } from '@nias/shared';
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

  // Order queries
  RequestItemQueries,
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
      const requestItemQueries = new RequestItemQueries(this.db);

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
