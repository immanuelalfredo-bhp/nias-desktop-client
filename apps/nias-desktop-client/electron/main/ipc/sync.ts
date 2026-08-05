import { randomUUID } from 'node:crypto';
import { ipcMain } from 'electron';
import { server, local, common } from '@nias/shared';
import { handleResponse, isSuccess, logger, type Envelope } from '@nias/shared/server';
import { AuthDatabase, UserDatabase } from '../db/database';
import { APP_ID, SYNC_SERVER_URL } from '../config';

export const registerSyncIpcHandlers = (
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void => {
  ipcMain.handle('sync:pull', async (_event): Promise<Envelope<server.PullResponse>> => {
    try {
      const accessToken = await resolveUserAccessToken(authDb, userId);
      if (!accessToken) {
        logger.error({ scope: 'sync' }, 'Sync pull failed: missing access token');
        return { success: false, message: 'Sync pull failed: missing access token' };
      }

      const pushPayload = userDb.sync.buildPushPayload(userId);
      const pushId = randomUUID();
      pushPayload.id = pushId;
      pushPayload.actorId = userId;

      if (pushPayload.changes.length > 0) {
        logger.info({ scope: 'sync', changes: pushPayload.changes.length }, 'Sync push requested');
        const pushResponse = await fetch(`${SYNC_SERVER_URL}/api/sync/push`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(pushPayload),
        });
        const pushData = await handleResponse(pushResponse, server.PushResponseSchema, 'sync');
        if (!isSuccess(pushData)) {
          logger.error({ scope: 'sync' }, 'Sync push failed');
          return { success: false, message: 'Sync push failed' };
        }

        userDb.sync.markChangesAsSynced(pushPayload);
      }

      let cursor = userDb.sync.getSyncVersion();
      let hasMore = false;
      let page = 0;
      const mergedResponse: server.PullResponse = {
        latestVersions: { ...cursor },
        hasMore: false,
        changes: Object.keys(cursor).reduce(
          (acc, key) => {
            acc[key as keyof server.PullResponse['changes']] = [];
            return acc;
          },
          {} as server.PullResponse['changes'],
        ),
      };

      do {
        page += 1;
        logger.info({ scope: 'sync', page, cursor }, 'Sync pull requested');

        const response = await fetch(`${SYNC_SERVER_URL}/api/sync/pull`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(cursor),
        });
        const data = await handleResponse(response, server.PullResponseSchema, 'sync');
        if (!isSuccess(data)) {
          return { success: false, message: 'Sync pull failed' };
        }

        const previousCursor = { ...cursor };
        cursor = userDb.sync.applyChanges(data);
        hasMore = data.hasMore;
        mergedResponse.changes = Object.keys(mergedResponse.changes).reduce(
          (acc, key) => {
            acc[key as keyof server.PullResponse['changes']] = [
              ...(mergedResponse.changes[key as keyof server.PullResponse['changes']] || []),
              ...(data.changes[key as keyof server.PullResponse['changes']] || []),
            ];
            return acc;
          },
          {} as server.PullResponse['changes'],
        );
        mergedResponse.latestVersions = { ...cursor };
        mergedResponse.hasMore = hasMore;

        if (hasMore && JSON.stringify(previousCursor) === JSON.stringify(cursor)) {
          logger.error(
            { scope: 'sync', page, previousCursor, cursor },
            'Sync pull failed: cursor did not advance despite hasMore being true',
          );
          return { success: false, message: 'Sync pull failed: cursor did not advance' };
        }
      } while (hasMore);

      logger.info(
        {
          scope: 'sync',
          pages: page,
          totalChanges: Object.keys(mergedResponse.changes).reduce(
            (acc, key) => {
              acc[key] = (
                mergedResponse.changes[key as keyof server.PullResponse['changes']] || []
              ).length;
              return acc;
            },
            {} as Record<string, number>,
          ),
          finalVersions: mergedResponse.latestVersions,
        },
        'Sync pull completed successfully',
      );

      return {
        success: true,
        message: 'Sync pull completed successfully',
        data: mergedResponse,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'sync',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Sync pull failed',
      );
      return { success: false, message: 'Sync pull failed' };
    }
  });
};

function hasUsableToken(user: local.User | null): user is local.User {
  return (
    !!user?.accessToken && !!user?.expiresAt && new Date(user.expiresAt).getTime() > Date.now()
  );
}

async function refreshUserToken(
  authDb: AuthDatabase,
  userId: string,
): Promise<common.SuccessResponse> {
  const user = authDb.main.getById(userId);
  if (!user) {
    logger.error({ scope: 'auth', userId }, 'User not found for token refresh');
    return { success: false, message: 'User not found' };
  }

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/sync/refresh-token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'app-id': `${APP_ID}`,
      },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    });
    const data = await handleResponse(response, server.TokenSchema, 'auth');
    if (!isSuccess(data)) {
      return data;
    }

    authDb.main.updateTokens(userId, data.accessToken, data.refreshToken, data.expiresAt);
    logger.info({ scope: 'auth', userId }, 'User token refreshed successfully');
    return { success: true, message: 'User token refreshed successfully' };
  } catch (error) {
    logger.error(
      {
        scope: 'auth',
        userId,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Error refreshing user token',
    );
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during token refresh',
    };
  }
}

export async function resolveUserAccessToken(
  authDb: AuthDatabase,
  userId: string,
): Promise<string | null> {
  let user = authDb.main.getById(userId);
  if (hasUsableToken(user)) {
    return user.accessToken ?? null;
  }
  const refreshResult = await refreshUserToken(authDb, userId);
  if (!refreshResult.success) {
    logger.error(
      { scope: 'auth', userId, message: refreshResult.message },
      'Unable to refresh user token',
    );
  }
  user = authDb.main.getById(userId);
  if (hasUsableToken(user)) {
    return user.accessToken ?? null;
  }
  return null;
}
