import Database from 'better-sqlite3-multiple-ciphers';
import { sync } from '@nias/shared';
import { logger } from '@nias/shared/server';
import { UserQueries } from './system/users.js';

export class SyncQueries {
  constructor(private readonly db: Database.Database) {}

  fetchSyncVersion(): sync.SyncMetadata {
    const result = this.db.prepare('SELECT * FROM sync_metadata').get() as sync.SyncMetadata;
    logger.debug({ scope: 'sync', version: result }, 'Fetched sync version from database');
    return result;
  }

  applyChanges(manifest: sync.PullManifest): sync.SyncMetadata {
    try {
      let nextVersions: sync.SyncMetadata = this.fetchSyncVersion();
      const previousVersions = { ...nextVersions };

      const tx = this.db.transaction(() => {
        const userQueries = new UserQueries(this.db);

        for (const user of manifest.changes.users) {
          userQueries.syncUsers(user);
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
