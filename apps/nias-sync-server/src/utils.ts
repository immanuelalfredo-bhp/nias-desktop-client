import { 
  user, 
  audit,
} from './schema.js';
import { 
  sharedSync,
  type VersionRegistry 
} from '@nias/shared';
import { type PgTransaction } from 'drizzle-orm/pg-core';

/** Database transaction type used by sync write operations. */
export type DBTransaction = PgTransaction<any, any, any>;

/**
 * Registry of sync-enabled tables.
 *
 * To add a new table, append an entry with a `key` matching
 * `sharedSync.SyncMetadata` and point `table` to its Drizzle schema.
 */
export const TABLE_MAP: {
  key: keyof sharedSync.SyncMetadata;
  table: any;
  responseKey: keyof sharedSync.SyncMetadata;
}[] = [
  {
    key: 'user' as const,
    table: user,
    responseKey: 'user' as const,
  },
  {
    key: 'audit' as const,
    table: audit,
    responseKey: 'audit' as const,
  },
];

/** Default server version registry for all sync-enabled tables. */
export const defaultRegistry = TABLE_MAP.reduce((acc, t) => {
  acc[t.key] = 0;
  return acc;
}, {} as VersionRegistry);

/**
 * Inserts or updates a record while stamping the next sync version.
 */
export async function upsertSyncRecords(
  tx: DBTransaction,
  table: any,
  payload: any,
  version: number
) {
  return await tx
    .insert(table)
    .values({ ...payload, syncVersion: version })
    .onConflictDoUpdate({
      target: table.id,
      set: { ...payload, syncVersion: version },
    })
    .returning();
}
