import Database from 'better-sqlite3-multiple-ciphers';
import { system, attribute, item, variant, order, server } from '@nias/shared';
import { logger } from '@nias/shared/server';
import {
  // System queries
  UserQueries,
  RoleQueries,
  ProjectQueries,
  RoleCapabilityQueries,
  RoleManagementQueries,
  RoleMapQueries,
  ProjectMapQueries,
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
  BrandlineMapQueries,
  VendorMapQueries,
  DimensionMapQueries,
  SystemMapQueries,
  TagMapQueries,
  GenerationRulesQueries,

  // Variant queries
  VariantRecordQueries,
  ComponentMapQueries,
  DimensionValueMapQueries,
  SwitchMapQueries,
  VendorPriceQueries,

  // Order queries
  RequestQueries,
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
      const roleQueries = new RoleQueries(this.db);
      const projectQueries = new ProjectQueries(this.db);
      const roleCapabilityQueries = new RoleCapabilityQueries(this.db);
      const roleManagementQueries = new RoleManagementQueries(this.db);
      const roleMapQueries = new RoleMapQueries(this.db);
      const projectMapQueries = new ProjectMapQueries(this.db);
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
      const brandlineMapQueries = new BrandlineMapQueries(this.db);
      const vendorMapQueries = new VendorMapQueries(this.db);
      const dimensionMapQueries = new DimensionMapQueries(this.db);
      const systemMapQueries = new SystemMapQueries(this.db);
      const tagMapQueries = new TagMapQueries(this.db);
      const generationRulesQueries = new GenerationRulesQueries(this.db);
      const variantRecordQueries = new VariantRecordQueries(this.db);
      const componentMapQueries = new ComponentMapQueries(this.db);
      const dimensionValueMapQueries = new DimensionValueMapQueries(this.db);
      const switchMapQueries = new SwitchMapQueries(this.db);
      const vendorPriceQueries = new VendorPriceQueries(this.db);
      const requestQueries = new RequestQueries(this.db);
      const requestItemQueries = new RequestItemQueries(this.db);

      const tx = this.db.transaction(() => {
        // Apply changes for each table in the manifest
        for (const user of manifest.changes.users as system.User[]) {
          userQueries.upsert(user);
        }
        for (const role of manifest.changes.roles as system.Role[]) {
          roleQueries.upsert(role);
        }
        for (const project of manifest.changes.projects as system.Project[]) {
          projectQueries.upsert(project);
        }
        for (const roleCapability of manifest.changes.roleCapabilities as system.RoleCapability[]) {
          roleCapabilityQueries.upsert(roleCapability);
        }
        for (const roleManagement of manifest.changes.roleManagement as system.RoleManagement[]) {
          roleManagementQueries.upsert(roleManagement);
        }
        for (const roleMap of manifest.changes.roleMap as system.RoleMap[]) {
          roleMapQueries.upsert(roleMap);
        }
        for (const projectMap of manifest.changes.projectMap as system.ProjectMap[]) {
          projectMapQueries.upsert(projectMap);
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
        for (const brandlineMap of manifest.changes.brandlineMap as item.BrandlineMap[]) {
          brandlineMapQueries.upsert(brandlineMap);
        }
        for (const vendorMap of manifest.changes.vendorMap as item.VendorMap[]) {
          vendorMapQueries.upsert(vendorMap);
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
        for (const componentMap of manifest.changes.componentMap as variant.ComponentMap[]) {
          componentMapQueries.upsert(componentMap);
        }
        for (const dimensionValueMap of manifest.changes
          .dimensionValueMap as variant.DimensionValueMap[]) {
          dimensionValueMapQueries.upsert(dimensionValueMap);
        }
        for (const switchMap of manifest.changes.switchMap as variant.SwitchMap[]) {
          switchMapQueries.upsert(switchMap);
        }
        for (const vendorPrice of manifest.changes.vendorPrice as variant.VendorPrice[]) {
          vendorPriceQueries.upsert(vendorPrice);
        }
        for (const request of manifest.changes.requests as order.Request[]) {
          requestQueries.upsert(request);
        }
        for (const requestItem of manifest.changes.requestItems as order.RequestItem[]) {
          requestItemQueries.upsert(requestItem);
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
