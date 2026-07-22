import { type PgTransaction } from 'drizzle-orm/pg-core';
import { server } from '@nias/shared';
import { SYNC_TABLE_MAP } from '@nias/shared/server';

/** Database transaction type used by sync write operations. */
export type DBTransaction = PgTransaction<any, any, any>;

export const TABLE_MAP = SYNC_TABLE_MAP;

export const defaultRegistry = SYNC_TABLE_MAP.reduce((acc, t) => {
  acc[t.key] = 0;
  return acc;
}, {} as server.SyncMetadata);

export async function upsertSyncRecords(
  tx: DBTransaction,
  table: any,
  payloads: any[],
  version: number,
) {
  const results = [];

  for (const payload of payloads) {
    const [row] = await tx
      .insert(table)
      .values({ ...payload, syncVersion: version })
      .onConflictDoUpdate({
        target: table.id,
        set: { ...payload, syncVersion: version },
      })
      .returning();

    if (row) {
      results.push(row);
    }
  }

  return results;
}
