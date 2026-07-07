import { 
  users, 
  audit,
} from './schema/index.js';
import { 
  sync,
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
  key: keyof sync.SyncMetadata;
  table: any;
  responseKey: keyof sync.SyncMetadata;
}[] = [
  {
    key: 'users' as const,
    table: users,
    responseKey: 'users' as const,
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
  payloads: any[],
  version: number
) {
  return await tx
    .insert(table)
    .values(payloads.map(p => ({ ...p, syncVersion: version })))
    .onConflictDoUpdate({
      target: table.id,
      set: { ...payloads[0], syncVersion: version },
    })
    .returning();
}