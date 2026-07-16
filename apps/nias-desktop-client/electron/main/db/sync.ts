import Database from 'better-sqlite3-multiple-ciphers';
import { sync } from '@nias/shared';
import { logger } from '@nias/shared/server';
import { UserQueries } from './system/users.js';
import { BrandQueries } from './attribute/brands.js';
import { ModeQueries } from './attribute/modes.js';
import { UomQueries } from './attribute/uoms.js';
import { DimensionQueries } from './attribute/dimensions.js';
import { DimensionValuesQueries } from './attribute/dimension-values.js';
import { SystemQueries } from './attribute/systems.js';
import { CategoryQueries } from './attribute/categories.js';
import { VendorQueries } from './attribute/vendors.js';
import { TagQueries } from './attribute/tags.js';

export class SyncQueries {
  constructor(private readonly db: Database.Database) {}

  fetchSyncVersion(): sync.SyncMetadata {
    const result = this.db.prepare(
      'SELECT users, brands, modes FROM sync_metadata WHERE id = 1',
    ).get() as sync.SyncMetadata;
    logger.debug({ scope: 'sync', version: result }, 'Fetched sync version from database');
    return result;
  }

  applyChanges(manifest: sync.PullManifest): sync.SyncMetadata {
    try {
      let nextVersions: sync.SyncMetadata = this.fetchSyncVersion();
      const previousVersions = { ...nextVersions };

      const tx = this.db.transaction(() => {
        const userQueries = new UserQueries(this.db);
        const brandQueries = new BrandQueries(this.db);
        const modeQueries = new ModeQueries(this.db);
        const uomQueries = new UomQueries(this.db);
        const dimensionQueries = new DimensionQueries(this.db);
        const dimensionValueQueries = new DimensionValuesQueries(this.db);
        const systemQueries = new SystemQueries(this.db);
        const categoryQueries = new CategoryQueries(this.db);
        const vendorQueries = new VendorQueries(this.db);
        const tagQueries = new TagQueries(this.db);

        for (const user of manifest.changes.users) {
          userQueries.upsertSynced(user);
          // brandQueries.upsertSynced(user.brands);
          // modeQueries.upsertSynced(user.modes);
          // uomQueries.upsertSynced(user.uoms);
          // dimensionQueries.upsertSynced(user.dimensions);
          // dimensionValueQueries.upsertSynced(user.dimensionValues);
          // systemQueries.upsertSynced(user.systems);
          // categoryQueries.upsertSynced(user.categories);
          // vendorQueries.upsertSynced(user.vendors);
          // tagQueries.upsertSynced(user.tags);
        }

        const maxPulledUserVersion = manifest.changes.users.reduce(
          (max, user) => Math.max(max, user.syncVersion ?? 0),
          nextVersions.users ?? 0,
        );
        nextVersions = {
          ...nextVersions,
          users: maxPulledUserVersion,
        };

        const syncVersionStmt = this.db.prepare(`UPDATE sync_metadata SET users = ? WHERE id = 1`);
        syncVersionStmt.run(nextVersions.users);

        logger.info(
          {
            scope: 'sync',
            pulledCount: manifest.changes.users.length,
            previousVersion: previousVersions.users,
            nextVersion: nextVersions.users,
          },
          'Sync version updated successfully',
        );
      });

      tx();
      return nextVersions;

    } catch (error) {
      logger.error(
        {
          scope: 'sync',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to apply changes to the database',
      );
      throw error;
    }
  }
}
