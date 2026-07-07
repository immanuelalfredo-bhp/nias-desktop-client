import { type Request, type Response } from 'express';
import { asc, gt } from 'drizzle-orm';
import type { Logger } from 'pino';
import {
  sync,
  common,
  type VersionRegistry,
} from '@nias/shared';
import { SYNC_LIMIT } from '../config.js';
import { db } from '../db.js';
import {
  proposedChanges,
  syncMetadata,
} from '../schema/index.js';
import { TABLE_MAP, defaultRegistry, upsertSyncRecords } from '../utils.js';

/**
 * Computes table-wise sync deltas by comparing client versions against
 * the server version registry.
 */
async function getSyncDelta(
  clientVersions: sync.SyncMetadata,
  context?: { log?: Logger; userId?: string }
): Promise<sync.PullManifest | common.SuccessResponse> {

  try {
    const rows = await db.select().from(syncMetadata).limit(1);
    const syncLimit = SYNC_LIMIT;
    const payload = clientVersions;

    const registry: VersionRegistry = { ...defaultRegistry, ...(rows[0] ?? {}) };

    const entries = await Promise.all(
      TABLE_MAP.map(async (tableInfo) => {
        const clientVersion = payload[tableInfo.key] ?? 0;
        const serverVersion = registry[tableInfo.key] ?? 0;
        if (clientVersion < serverVersion) {
          return db
            .select()
            .from(tableInfo.table)
            .where(gt(tableInfo.table.syncVersion, clientVersion))
            .limit(syncLimit)
            .orderBy(asc(tableInfo.table.syncVersion));
        } else {
          return [];
        }
      })
    );

    const changes = Object.fromEntries(
      TABLE_MAP.map((t, idx) => [t.responseKey, entries[idx] ?? []])
    ) as sync.PullManifest['changes'];

    context?.log?.info(
      {
        hasMore: entries.some(r => r.length === syncLimit),
        latestVersions: registry,
        tableCounts: Object.fromEntries(
        Object.entries(changes).map(([key, rows]) => [key, rows.length])
      ),
      },
      'Computed sync delta'
    );

    return {
      success: true,
      changes,
      latestVersions: registry,
      hasMore: entries.some(r => r.length === syncLimit),
    };
  } catch (error) {
    context?.log?.error({ error }, 'Error computing sync delta');
    return { success: false, message: 'Failed to compute sync delta' };
  }
}

export async function handlePull(req: Request, res: Response):
  Promise<Response<sync.PullManifest | common.SuccessResponse>> 
{
  try {
    const metadata = req.validatedBody as sync.SyncMetadata;
    req.log.info({ metadata }, 'Starting sync pull');

    const data = await getSyncDelta(metadata);
    const changes = 'changes' in data ? data.changes : {};

    req.log.info(
      {
        hasMore: 'hasMore' in data ? data.hasMore : false,
        latestVersions: 'latestVersions' in data ? data.latestVersions : {},
        tableCounts: Object.fromEntries(
          Object.entries(changes).map(([key, rows]) => [
            key, 
            (rows as any[]).length
          ])
        ),
      },
      'Completed sync pull'
    );

    return res.json(data);
  } catch (error) {
    req.log.error({ error }, 'Error handling sync pull');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

  /**
   * Applies client-submitted changes in a transaction and advances
   * per-table sync versions.
   */
export async function handlePush (
  payload: sync.PushPayload,
  context?: { log?: Logger; userId?: string }): 
  Promise<sync.PushResponse | common.SuccessResponse> 
{
    try {
    context?.log?.info(
      {
        actorId: payload.actorId,
        changes: payload.changes.length,
      },
      'Starting sync push'
    );

    return await db.transaction(async (tx) => {
      const [syncRow] = await tx
        .select()
        .from(syncMetadata)
        .for('update')
        .limit(1);

      const registry: VersionRegistry = { 
        ...defaultRegistry, 
        ...(syncRow ?? {}) 
      };
        
      const changesByTable = payload.changes.reduce((acc, change) => {
        if (!acc[change.tableName]) {
          acc[change.tableName] = [];
        }
        acc[change.tableName]?.push(change);
        return acc;
      }, {} as Record<string, typeof payload.changes>);
      const processedItems = [];

      for (const [tableName, changes] of Object.entries(changesByTable)) {
        const tableInfo = TABLE_MAP.find(t => t.key === tableName);
        if (!tableInfo) {
          context?.log?.warn(
            { tableName },
            'Unknown table in sync change, skipping'
          );
          continue;
        }

        const newVersion = (registry[tableInfo.key] ?? 0) + changes.length;
        registry[tableInfo.key] = newVersion;

        const updated = await upsertSyncRecords(
          tx,
          tableInfo.table,
          changes.map(c => c.payload),
          newVersion
        );
        processedItems.push({ table: tableName, data: updated });

        await tx.insert(proposedChanges).values(
          changes.map(c => ({
            id: c.id,
            tableName: c.tableName,
            payload: JSON.stringify(c.payload),
            status: 'processed',
            processedAt: new Date().toISOString(),
          }))
        );
      }

      await tx.update(syncMetadata).set(registry as typeof syncMetadata.$inferInsert);

      context?.log?.info(
        {
          actorId: payload.actorId,
          changes: payload.changes.length,
          processed: processedItems.length,
        },
        'Completed sync push'
      );

      return { success: true, syncedItems: processedItems };
    });
  } catch (error) {
    context?.log?.error({ error }, 'Error handling sync push');
    return { success: false, message: 'Failed to process sync push' };
  }
}