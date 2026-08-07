import { type Request, type Response } from 'express';
import { asc, gt } from 'drizzle-orm';
import type { Logger } from 'pino';
import { server } from '@nias/shared';
import { syncMetadata, SYNC_TABLE_MAP, type Envelope } from '@nias/shared/server';
import { SYNC_LIMIT } from '../config.js';
import { db } from '../db.js';
import { defaultRegistry, upsertSyncRecords } from '../utils.js';
import { supabase } from '../supabase.js';

export function getSyncTableOrder(): Array<(typeof SYNC_TABLE_MAP)[number]['tableName']> {
  return [
    'users',
    'audit',
    'brands',
    'modes',
    'uoms',
    'dimensions',
    'dimension_values',
    'systems',
    'categories',
    'vendors',
    'tags',
    'item_records',
    'aliases',
    'dimension_map',
    'system_map',
    'tag_map',
    'generation_rules',
    'variant_records',
    'dimension_value_map',
  ];
}

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

    const latestVersions = Object.fromEntries(
      SYNC_TABLE_MAP.map((tableInfo, idx) => {
        const rows = entries[idx] ?? [];
        const latestVisibleVersion =
          rows.length > 0
            ? ((rows[rows.length - 1] as { syncVersion?: number })?.syncVersion ??
              (payload[tableInfo.key] ?? 0))
            : (registry[tableInfo.key] ?? 0);

        return [tableInfo.key, latestVisibleVersion];
      }),
    ) as server.SyncMetadata;

    const changes = Object.fromEntries(
      SYNC_TABLE_MAP.map((t, idx) => [t.key, entries[idx] ?? []]),
    ) as server.PullResponse['changes'];

    context?.log?.info(
      {
        scope: 'sync',
        hasMore: entries.some((r) => r.length === syncLimit),
        latestVersions,
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
        latestVersions,
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

export async function handlePush(
  payload: any,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<any>> {
  try {
    context?.log?.info(
      { scope: 'sync', actorId: payload.actorId, changes: payload.changes.length },
      'Starting sync push',
    );

    return await db.transaction(async (tx) => {
      const metadataRows = await tx.select().from(syncMetadata);
      const registry: Record<string, number> = { ...defaultRegistry };
      for (const row of metadataRows) {
        if (row.tableName) {
          registry[row.tableName] = row.syncVersion ?? 0;
        }
      }

      const changesByTable = payload.changes.reduce(
        (acc: Record<string, any[]>, change: any) => {
          if (!acc[change.tableName]) {
            acc[change.tableName] = [];
          }
          acc[change.tableName]?.push(change);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const processedItems: any[] = [];
      for (const tableName of getSyncTableOrder()) {
        const changes = changesByTable[tableName];
        if (!changes?.length) {
          continue;
        }

        const tableInfo = SYNC_TABLE_MAP.find((entry) => entry.tableName === tableName);
        if (!tableInfo) {
          context?.log?.warn({ scope: 'sync', tableName, actorId: payload.actorId }, 'Unknown table in sync change, skipping');
          continue;
        }

        const newVersion = (registry[tableInfo.key] ?? 0) + changes.length;
        registry[tableInfo.key] = newVersion;

        const updated = await upsertSyncRecords(
          tx,
          tableInfo.table,
          changes.map((change: any) => ({
            ...change.payload,
            id: change.id,
            isSynced: true,
            syncVersion: newVersion,
          })),
          newVersion,
        );
        processedItems.push({ table: tableName, data: updated });

        await tx
          .insert(syncMetadata)
          .values({ tableName: tableInfo.tableName, syncVersion: newVersion })
          .onConflictDoUpdate({
            target: syncMetadata.tableName,
            set: { syncVersion: newVersion },
          });
      }

      context?.log?.info(
        {
          scope: 'sync',
          actorId: payload.actorId,
          changes: payload.changes.length,
          processed: processedItems.length,
        },
        'Completed sync push',
      );

      return {
        success: true,
        message: 'Sync push completed successfully',
        data: { syncedItems: processedItems },
      };
    });
  } catch (error) {
    context?.log?.error({ scope: 'sync', error }, 'Error handling sync push');
    return { success: false, message: 'Failed to process sync push' };
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
