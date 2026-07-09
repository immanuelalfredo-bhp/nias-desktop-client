import { type PgTransaction } from 'drizzle-orm/pg-core';
import { sync } from '@nias/shared';
import { users } from '@nias/shared/server';

/** Database transaction type used by sync write operations. */
export type DBTransaction = PgTransaction<any, any, any>;

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
];

export const defaultRegistry = TABLE_MAP.reduce((acc, t) => {
  acc[t.key] = 0;
  return acc;
}, {} as sync.SyncMetadata);

export async function upsertSyncRecords(
  tx: DBTransaction,
  table: any,
  payloads: any[],
  version: number,
) {
  return await tx
    .insert(table)
    .values(payloads.map((p) => ({ ...p, syncVersion: version })))
    .onConflictDoUpdate({
      target: table.id,
      set: { ...payloads[0], syncVersion: version },
    })
    .returning();
}
