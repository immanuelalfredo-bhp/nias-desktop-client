import { auth, common } from '@nias/shared';
import { handleResponse, isSuccess, logger } from '@nias/shared/server';
import { APP_ID, SYNC_SERVER_URL } from '../config.js';
import type { AuthDatabase } from '../db/database.js';

const TOKEN_REFRESH_THRESHOLD_MS = 60_000;

function hasUsableToken(user: auth.LocalUser | null): user is auth.LocalUser {
  return !!user?.jwtToken && !!user.jwtTokenExpiration && user.jwtTokenExpiration > Date.now();
}

function shouldRefreshToken(user: auth.LocalUser | null): boolean {
  return (
    !user?.jwtToken ||
    !user.jwtTokenExpiration ||
    user.jwtTokenExpiration <= Date.now() + TOKEN_REFRESH_THRESHOLD_MS
  );
}

export async function refreshAuthUsers(authDb: AuthDatabase): Promise<common.SuccessResponse> {
  try {
    const payload = authDb.main.listLocalUserSyncStates();
    logger.info({ scope: 'auth', payload }, 'Refreshing locally stored auth users before sync');

    const response = await fetch(`${SYNC_SERVER_URL}/api/login/sync`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'app-id': `${APP_ID}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response, auth.LoginSyncDeltaSchema, 'auth');
    if (!isSuccess(data)) {
      return { success: false, message: data.message };
    }

    authDb.main.runInTransaction(() => {
      for (const user of data.changes) {
        authDb.main.upsertLocalUser({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          syncVersion: user.syncVersion,
          jwtToken: user.jwtToken,
          jwtTokenExpiration: user.jwtTokenExpiration,
        });
      }

      for (const deletedUserId of data.deletedUserIds) {
        authDb.main.deleteLocalUser(deletedUserId);
      }
    });

    return { success: true, message: 'Stored auth users refreshed successfully' };
  } catch (error) {
    logger.error({ scope: 'auth', error }, 'Failed to refresh locally stored auth users');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to refresh stored auth users',
    };
  }
}

export async function resolveUserJwtToken(
  authDb: AuthDatabase,
  userId: string,
): Promise<string | null> {
  let user = authDb.main.getLocalUserById(userId);
  if (hasUsableToken(user) && !shouldRefreshToken(user)) {
    return user.jwtToken ?? null;
  }

  const refreshResult = await refreshAuthUsers(authDb);
  if (!refreshResult.success) {
    logger.error(
      { scope: 'auth', userId, message: refreshResult.message },
      'Unable to refresh stored auth users before resolving JWT token',
    );
  }

  user = authDb.main.getLocalUserById(userId);
  if (hasUsableToken(user)) {
    return user.jwtToken ?? null;
  }

  logger.error({ scope: 'auth', userId }, 'No usable JWT token available for the current user');
  return null;
}