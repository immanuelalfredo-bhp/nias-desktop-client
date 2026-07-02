import { ipcMain } from 'electron';
import { AuthDatabase } from '../db/database.js';
import { verifyPassword } from '@nias/shared/';
import { APP_ID, SYNC_SERVER_URL } from '../config.js';

export const registerAuthIpcHandlers = (authDb: AuthDatabase): void => {
  ipcMain.handle('auth:status', async () => {
    const userCount = authDb.main.countLocalUsers();
    const isEmpty = userCount === 0;
    console.log('User count:', userCount);
    console.log('DEBUG: Returning isEmpty as', isEmpty);
    return { isEmpty: userCount === 0 };
  });

  ipcMain.handle('auth:login', async (_event, payload: { username: string; password: string }) => {
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
      return { success: false, message: 'An error occurred during login' };
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Fetch user failed');
      }

      authDb.main.insertLocalUser({
        id: data.id,
        username: data.username,
        passwordHash: data.passwordHash,
        syncVersion: data.syncVersion
      });

      return { success: true, message: 'User fetched and stored successfully' };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, message: 'An error occurred while fetching the user' };
    }
  });

  ipcMain.handle('auth:sync-users', async (_event) => {
    try {
      const payload = authDb.main.listLocalUserIdsAndSyncVersion();

      const response = await fetch(`${SYNC_SERVER_URL}/api/login/sync`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'app-id': `${APP_ID}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Sync failed');
      }
      
      authDb.main.runInTransaction(() => {
        for (const user of data.changes) {
          authDb.main.updateLocalUsers({
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            syncVersion: user.syncVersion
          });
        }

        for (const deletedUserId of data.deletedUsers) {
          authDb.main.deleteLocalUsers(deletedUserId);
        }
      });

      return { success: true, message: 'Users synced successfully' };
    } catch (error) {
      console.error('Error syncing users:', error);
      return { success: false, message: 'An error occurred while syncing users' };
    }
  });
}