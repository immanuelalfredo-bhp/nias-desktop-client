import Database from 'better-sqlite3-multiple-ciphers';
import { sync } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class SyncQueries {
  constructor(private readonly db: Database.Database) {}

  fetchSyncVersion(): sync.SyncMetadata {
    const result = this.db.prepare('SELECT * FROM sync_metadata').get() as sync.SyncMetadata;
    logger.debug({ scope: 'sync', version: result }, 'Fetched sync version from database');
    return result;
  }
}