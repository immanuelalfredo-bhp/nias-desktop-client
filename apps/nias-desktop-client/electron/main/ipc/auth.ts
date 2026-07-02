import { ipcMain } from 'electron';
import { AuthDatabase } from '../db/database.js';
import {
  verifyPassword,
  type LoginCredentials,
  type RemoteUserRecord,
  type UserSyncDelta,
} from '@nias/shared';
import { APP_ID, SYNC_SERVER_URL } from '../config.js';

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const registerAuthIpcHandlers = (authDb: AuthDatabase): void => {
  ipcMain.handle('auth:status', async () => {
    const userCount = authDb.main.countLocalUsers();
    return { isEmpty: userCount === 0 };
  });

  ipcMain.handle('auth:login', async (_event, payload: LoginCredentials) => {
    try {
      const user = authDb.main.findLocalUser(payload.username);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isPasswordValid = await verifyPassword(user.password_hash, payload.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'An error occurred during login'),
      };
    }
  });

  ipcMain.handle('auth:fetch-user', async (_event, username: string, password: string) => {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/login/fetch`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'app-id': `${APP_ID}`,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as
        | { user?: RemoteUserRecord | null }
        | ErrorResponseBody;

      if (!response.ok) {
        const responseMessage = isErrorResponseBody(data)
          ? data.message ?? data.error
          : undefined;

        throw new Error(responseMessage ?? 'Fetch user request failed');
      }

      if (!('user' in data) || !data.user) {
        return { success: false, message: 'User not found on sync server' };
      }

      authDb.main.upsertLocalUser({
        id: data.user.id,
        username: data.user.username,
        passwordHash: data.user.passwordHash,
        syncVersion: data.user.syncVersion,
      });

      return { success: true, message: 'User fetched and stored successfully' };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: getErrorMessage(
          error,
          'An error occurred while fetching the user'
        ),
      };
    }
  });

  ipcMain.handle('auth:sync-users', async (_event) => {
    try {
      const payload = authDb.main.listLocalUserSyncStates();

      const response = await fetch(`${SYNC_SERVER_URL}/api/login/sync`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'app-id': `${APP_ID}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as UserSyncDelta | ErrorResponseBody;

      if (!response.ok) {
        const responseMessage = isErrorResponseBody(data)
          ? data.message ?? data.error
          : undefined;

        throw new Error(responseMessage ?? 'Sync request failed');
      }

      if (!('changes' in data) || !('deletedUserIds' in data)) {
        throw new Error('Sync server returned an invalid payload');
      }

      authDb.main.runInTransaction(() => {
        for (const user of data.changes) {
          authDb.main.updateLocalUsers({
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            syncVersion: user.syncVersion,
          });
        }

        for (const deletedUserId of data.deletedUserIds) {
          authDb.main.deleteLocalUsers(deletedUserId);
        }
      });

      return { success: true, message: 'Users synced successfully' };
    } catch (error) {
      console.error('Error syncing users:', error);
      return {
        success: false,
        message: getErrorMessage(
          error,
          'An error occurred while syncing users'
        ),
      };
    }
  });
};