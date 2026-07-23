import { type Request, type Response } from 'express';
import { asc, gt } from 'drizzle-orm';
import type { Logger } from 'pino';
import { server } from '@nias/shared';
import { syncMetadata, SYNC_TABLE_MAP, type Envelope } from '@nias/shared/server';
import { SYNC_LIMIT } from '../config.js';
import { db } from '../db.js';
import { defaultRegistry, upsertSyncRecords } from '../utils.js';
import { supabase } from '../supabase.js';

async function getSyncDelta(
  clientVersions: server.SyncMetadata,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<server.PullResponse>> {
  try {
    const rows = await db.select().from(syncMetadata);
    const syncLimit = SYNC_LIMIT;
    const payload = clientVersions;

    const registry: server.SyncMetadata = { ...defaultRegistry };
    for (const row of rows) {
      if (row.tableName) {
        registry[row.tableName] = row.syncVersion ?? 0;
      }
    }

    const entries = await Promise.all(
      SYNC_TABLE_MAP.map(async (tableInfo) => {
        const clientVersion = payload[tableInfo.key] ?? 0;
        const serverVersion = registry[tableInfo.key] ?? 0;

        if (clientVersion < serverVersion) {
          context?.log?.info(
            {
              scope: 'sync',
              table: tableInfo.key,
              clientVersion,
              serverVersion,
              userId: context?.userId,
              syncVersion: tableInfo.table.syncVersion,
            },
            'Client version is behind server version, fetching changes',
          );
          return (
            db
              .select()
              .from(tableInfo.table)
              .where(gt(tableInfo.table.syncVersion, clientVersion))
              // We limit the number of records to avoid massive memory spikes
              // and to keep individual network responses within safe size limits.
              .limit(syncLimit)
              .orderBy(asc(tableInfo.table.syncVersion))
          );
        } else {
          return [];
        }
      }),
    );

    const changes = Object.fromEntries(
      SYNC_TABLE_MAP.map((t, idx) => [t.key, entries[idx] ?? []]),
    ) as server.PullResponse['changes'];

    context?.log?.info(
      {
        scope: 'sync',
        hasMore: entries.some((r) => r.length === syncLimit),
        latestVersions: registry,
        tableCounts: Object.fromEntries(
          Object.entries(changes).map(([key, rows]) => [key, rows.length]),
        ),
      },
      'Computed sync delta',
    );

    return {
      success: true,
      message: 'Sync delta computed successfully',
      data: {
        changes,
        hasMore: entries.some((r) => r.length === syncLimit),
        latestVersions: registry,
      },
    };
  } catch (error) {
    context?.log?.error(
      {
        scope: 'sync',
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Error computing sync delta',
    );
    return { success: false, message: 'Failed to compute sync delta' };
  }
}

export async function handlePull(
  req: Request,
  res: Response,
): Promise<Response<Envelope<server.PullResponse>>> {
  try {
    const metadata = req.validatedBody as server.SyncMetadata;
    req.log.info({ scope: 'sync', metadata }, 'Starting sync pull');

    const data = await getSyncDelta(metadata);

    if (!data.success) {
      req.log.error({ scope: 'sync', message: data.message }, 'Failed to compute sync delta');
      return res.status(500).json(data);
    }

    const changes = data.data?.changes ?? {};
    if (!changes) {
      req.log.info({ scope: 'sync' }, 'No changes to sync, returning empty response');
      return res.json(data);
    }

    req.log.info(
      {
        scope: 'sync',
        hasMore: data.data?.hasMore ?? false,
        latestVersions: data.data?.latestVersions ?? {},
        tableCounts: Object.fromEntries(
          Object.entries(changes).map(([key, rows]) => [key, (rows as any[]).length]),
        ),
      },
      'Completed sync pull',
    );

    return res.json(data);
  } catch (error) {
    req.log.error(
      {
        scope: 'sync',
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Error handling sync pull',
    );
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function refreshUserToken(
  params: server.RefreshToken,
  context?: { log?: Logger },
): Promise<Envelope<server.Token>> {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: params.refreshToken,
    });

    if (error) {
      context?.log?.error(
        {
          scope: 'auth',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to refresh user token',
      );
      return { success: false, message: 'Failed to refresh user token' };
    }

    if (!data.session) {
      context?.log?.error({ scope: 'auth' }, 'No session returned from Supabase');
      return { success: false, message: 'No session returned from Supabase' };
    }

    const accessToken = data.session.access_token;
    const expiresAt = new Date(data.session.expires_at! * 1000).toISOString();
    const newRefreshToken = data.session.refresh_token;

    context?.log?.info(
      { scope: 'auth', expiresAt, refreshToken: newRefreshToken },
      'Successfully refreshed user token',
    );
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken, expiresAt, refreshToken: newRefreshToken },
    };
  } catch (error) {
    context?.log?.error(
      {
        scope: 'auth',
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Error during token refresh',
    );
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during token refresh',
    };
  }
}

// export async function handlePush(
//   payload: sync.PushPayload,
//   context?: { log?: Logger; userId?: string },
// ): Promise<Envelope<sync.PushResponse>> {
//   try {
//     context?.log?.info(
//       {
//         scope: 'sync',
//         actorId: payload.actorId,
//         changes: payload.changes.length,
//       },
//       'Starting sync push',
//     );

//     return await db.transaction(async (tx) => {
//       // We lock the metadata row to ensure that concurrent sync pushes
//       // do not result in race conditions when calculating the next version number.
//       const [syncRow] = await tx.select().from(syncMetadata).for('update').limit(1);

//       const registry: sync.SyncMetadata = {
//         ...defaultRegistry,
//         ...(syncRow ?? {}),
//       };

//       const changesByTable = payload.changes.reduce(
//         (acc, change) => {
//           if (!acc[change.tableName]) {
//             acc[change.tableName] = [];
//           }
//           acc[change.tableName]?.push(change);
//           return acc;
//         },
//         {} as Record<string, typeof payload.changes>,
//       );
//       const processedItems = [];

//       for (const [tableName, changes] of Object.entries(changesByTable)) {
//         const tableInfo = TABLE_MAP.find((t) => t.tableName === tableName);
//         if (!tableInfo) {
//           context?.log?.warn(
//             { scope: 'sync', tableName, actorId: payload.actorId },
//             'Unknown table in sync change, skipping',
//           );
//           continue;
//         }

//         // Increment the global table version by the number of changes processed
//         // to ensure every distinct batch of updates receives a unique version watermark.
//         const newVersion = (registry[tableInfo.key] ?? 0) + changes.length;
//         registry[tableInfo.key] = newVersion;

//         const updated = await upsertSyncRecords(
//           tx,
//           tableInfo.table,
//           changes.map((c) => c.payload),
//           newVersion,
//         );
//         processedItems.push({ table: tableName, data: updated });

//         // We record processed changes in a history table for auditability
//         // and to allow for potential future "undo" or conflict resolution features.
//         await tx.insert(changelog).values(
//           changes.map((c) => ({
//             id: c.id,
//             userId: payload.actorId,
//             tableName: c.tableName,
//             payload: JSON.stringify(c.payload),
//             processedAt: new Date().toISOString(),
//           })),
//         );
//       }

//       await tx.update(syncMetadata).set(registry as typeof syncMetadata.$inferInsert);

//       context?.log?.info(
//         {
//           scope: 'sync',
//           actorId: payload.actorId,
//           changes: payload.changes.length,
//           processed: processedItems.length,
//         },
//         'Completed sync push',
//       );

//       return {
//         success: true,
//         message: 'Sync push completed successfully',
//         data: { syncedItems: processedItems },
//       };
//     });
//   } catch (error) {
//     context?.log?.error({ scope: 'sync', error }, 'Error handling sync push');
//     return { success: false, message: 'Failed to process sync push' };
//   }
// }
