import { ipcMain } from 'electron';
import { sync } from '@nias/shared';
import { handleResponse, isSuccess, logger, type Envelope } from '@nias/shared/server';
import { AuthDatabase, UserDatabase } from '../db/database';
import { SYNC_SERVER_URL } from '../config';
import { resolveUserJwtToken } from './auth-session.js';

export const registerSyncIpcHandlers = (
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void => {
  ipcMain.handle('sync:fetch-version', async (_event): Promise<Envelope<sync.SyncMetadata>> => {
    try {
      const syncVersion = userDb.sync.fetchSyncVersion();
      logger.info({ scope: 'sync', version: syncVersion }, 'Sync version fetched successfully');
      return {
        success: true,
        message: 'Sync version fetched successfully',
        data: syncVersion,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'sync',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to fetch sync version',
      );
      return {
        success: false,
        message: 'Failed to fetch sync version',
      };
    }
  });

  ipcMain.handle('sync:pull', async (_event): Promise<Envelope<sync.PullManifest>> => {
    try {
      const jwtToken = await resolveUserJwtToken(authDb, userId);
      if (!jwtToken) {
        logger.error({ scope: 'sync' }, 'Sync pull failed: missing JWT token');
        return { success: false, message: 'Sync pull failed: missing JWT token' };
      }

      let cursor = userDb.sync.fetchSyncVersion();
      let hasMore = false;
      let page = 0;
      const mergedManifest: sync.PullManifest = {
        latestVersions: { ...cursor },
        hasMore: false,
        changes: { users: [] },
      };

      do {
        page += 1;
        logger.info({ scope: 'sync', page, cursor }, 'Sync pull requested');

        const response = await fetch(`${SYNC_SERVER_URL}/api/sync/pull`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(cursor),
        });

        const data = await handleResponse(response, sync.PullManifestSchema, 'sync');
        if (!isSuccess(data)) {
          return { success: false, message: 'Sync pull failed' };
        }

        const previousCursor = { ...cursor };
        cursor = userDb.sync.applyChanges(data);
        hasMore = data.hasMore;

        mergedManifest.changes.users.push(...data.changes.users);
        mergedManifest.latestVersions = { ...cursor };
        mergedManifest.hasMore = hasMore;

        if (hasMore && cursor.users <= previousCursor.users) {
          logger.error(
            {
              scope: 'sync',
              page,
              previousCursor,
              cursor,
            },
            'Sync pull pagination stalled: cursor did not advance',
          );
          return {
            success: false,
            message: 'Sync pull failed: pagination stalled without version progress',
          };
        }
      } while (hasMore);

      logger.info(
        {
          scope: 'sync',
          pages: page,
          totalUsers: mergedManifest.changes.users.length,
          finalVersions: mergedManifest.latestVersions,
        },
        'Sync pull completed successfully',
      );

      return {
        success: true,
        message: 'Sync pull completed successfully',
        data: mergedManifest,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'sync',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Sync pull failed',
      );
      return { success: false, message: 'Sync pull failed' };
    }
  });
};
