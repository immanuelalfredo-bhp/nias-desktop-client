import { type Request, type Response } from 'express';
import { db } from '../db.js';
import { asc, eq, gte } from 'drizzle-orm';
import { SYNC_LIMIT } from '../config.js';
import { TABLE_MAP, defaultRegistry, upsertSyncRecords } from '../utils.js';
import { 
  sync, 
  proposedChanges
} from '../schema.js';
import { 
  sharedSync, 
  type SyncChanges,
  type VersionRegistry 
} from '@nias/shared/src/index.js';
import type { Logger } from 'pino';

/**
 * Computes table-wise sync deltas by comparing client versions against
 * the server version registry.
 */
export async function getSyncDelta(
  clientVersions: sharedSync.SyncMetadata
): Promise<{
  changes: SyncChanges;
  latestVersions: VersionRegistry;
  hasMore: boolean;
}> {
  const rows = await db.select().from(sync);
  const syncLimit = SYNC_LIMIT; // Limit the number of changes sent in one response
  const payload = clientVersions;

  const registry: VersionRegistry = { ...defaultRegistry, ...(rows[0] ?? {}) };

  const entries = await Promise.all(
    TABLE_MAP.map(async (t): Promise<any[]> => {
      const clientVer = payload[t.key] ?? 0;
      const serverVer = registry[t.key] ?? 0;

      return clientVer < serverVer
        ? db
            .select()
            .from(t.table)
            .where(gte(t.table.syncVersion, clientVer))
            .limit(syncLimit)
            .orderBy(asc(t.table.syncVersion)) || []
        : [];
    })
  );

  const changes = TABLE_MAP.reduce((acc, t, idx) => {
    acc[t.responseKey] = entries[idx] ?? [];
    return acc;
  }, {} as SyncChanges);

  return {
    changes,
    latestVersions: registry,
    hasMore: entries.some(r => r.length === syncLimit),
  };
}

/** Handles pull requests by returning server-side changes since client versions. */
export async function handlePull(req: Request, res: Response) {
  const metadata = req.validatedBody as sharedSync.SyncMetadata;
  req.log.info({ metadata }, 'Starting sync pull');

  const data = await getSyncDelta(metadata);

  req.log.info(
    {
      hasMore: data.hasMore,
      latestVersions: data.latestVersions,
      tableCounts: Object.fromEntries(
        Object.entries(data.changes).map(([key, rows]) => [key, rows.length])
      ),
    },
    'Completed sync pull'
  );

  return res.json(data);
}

/**
 * Applies client-submitted changes in a transaction and advances
 * per-table sync versions.
 */
export async function handlePush (
  payload: sharedSync.PushPayload,
  context?: { log?: Logger; userId?: string }
) {
  context?.log?.info(
    { actorId: payload.actorId, userId: context.userId, changes: payload.changes.length },
    'Starting sync push'
  );

  return await db.transaction(async (tx) => {

    const [syncRow] = await tx
      .select()
      .from(sync)
      .for('update')
      .limit(1);

    const registry: VersionRegistry = { 
      ...defaultRegistry, 
      ...(syncRow ?? {}) 
    };

    const versionTracker: VersionRegistry = { ...registry };
    const processedItems = [];

    for (const change of payload.changes) {
      
      await tx.insert(proposedChanges).values({
        id: change.id,
        tableName: change.tableName,
        payload: JSON.stringify(change.payload),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      const tableInfo = TABLE_MAP.find(t => t.key === change.tableName);

      if (tableInfo) {
        const currentVersion = versionTracker[tableInfo.key] ?? 0;
        versionTracker[tableInfo.key] = currentVersion + 1;

        const newVersion = versionTracker[tableInfo.key] as number;

        // Apply the change to the target table with the new sync version
        const [updated] = await upsertSyncRecords(
          tx,
          tableInfo.table,
          change.payload,
          newVersion
        );
        processedItems.push({ table: change.tableName, data: updated });
      } else {
        context?.log?.warn(
          { tableName: change.tableName },
          'Unknown table in sync change, skipping'
        );
      }
        
      // Mark the proposed change as processed
      await tx.update(proposedChanges).set({
        status: 'processed',
        processedAt: new Date().toISOString(),
      }).where(eq(proposedChanges.id, change.id));
    }

    await tx.update(sync).set(versionTracker as typeof sync.$inferInsert);

    context?.log?.info(
      {
        actorId: payload.actorId,
        changes: payload.changes.length,
        processed: processedItems.length,
      },
      'Completed sync push'
    );

    return { status: 'success', syncedItems: processedItems };
  });
}