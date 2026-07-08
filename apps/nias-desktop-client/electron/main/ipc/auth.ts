import { ipcMain } from 'electron';
import { safeParse } from 'zod';
import { AuthDatabase, initializeUserDatabase } from '../db/database.js';
import {
  auth,
  common,
  logger,
  isSuccess,
  handleResponse,
  verifyPassword,
  type Envelope,
} from '@nias/shared';
import { APP_ID, SYNC_SERVER_URL } from '../config.js';

export const registerAuthIpcHandlers = (authDb: AuthDatabase): void => {
  ipcMain.handle('auth:status', async (_event): Promise<Envelope<auth.StatusResponse>> => {
    const userCount = authDb.main.countLocalUsers();
    logger.info({ scope: 'auth', userCount }, 'Auth status retrieved successfully');
    return {
      success: true,
      message: 'Auth status retrieved successfully',
      data: {
        isEmpty: userCount === 0,
      },
    };
  });

  ipcMain.handle(
    'auth:login',
    async (_event, email: string, password: string): Promise<common.SuccessResponse> => {
      try {
        const loginCredentials = safeParse(auth.LoginCredentialsSchema, { email, password });
        if (!loginCredentials.success) {
          logger.warn({ scope: 'auth', email }, 'Login failed: Invalid credentials format');
          return { success: false, message: 'Invalid credentials format' };
        }

        const user = authDb.main.getLocalUser(email);
        if (!user) {
          const response = await fetch(`${SYNC_SERVER_URL}/api/login/initial`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'app-id': `${APP_ID}`,
            },
            body: JSON.stringify(loginCredentials),
          });

          const data = await handleResponse(response, auth.LoginDataSchema, 'auth');
          if (!isSuccess(data)) {
            return data;
          }

          logger.info(
            { scope: 'auth', userId: data.id },
            'User fetched successfully from sync server',
          );
          authDb.main.runInTransaction(() => {
            authDb.main.upsertLocalUser({
              id: data.id,
              email: data.email,
              passwordHash: data.passwordHash,
              syncVersion: data.syncVersion,
              jwtToken: data.jwtToken,
              jwtTokenExpiration: data.jwtTokenExpiration,
            });
          });
          logger.info({ scope: 'auth', userId: data.id }, 'User fetched and stored successfully');

          initializeUserDatabase(data.id);
          logger.info({ scope: 'auth', userId: data.id }, 'User database initialized successfully');

          return { success: true, message: 'User fetched and stored successfully' };
        }

        const isPasswordValid = await verifyPassword(user.passwordHash, password);
        if (!isPasswordValid) {
          logger.warn({ scope: 'auth', userId: user.id }, 'Login failed: Invalid password');
          return { success: false, message: 'Invalid password' };
        }

        logger.info({ scope: 'auth', userId: user.id }, 'Login successful for local user');
        return { success: true, message: 'Login successful' };
      } catch (error) {
        logger.error({ scope: 'auth', error }, 'Error during login');
        return {
          success: false,
          message: error instanceof Error ? error.message : 'An error occurred during login',
        };
      }
    },
  );

  ipcMain.handle('auth:sync', async (_event): Promise<common.SuccessResponse> => {
    try {
      const payload = authDb.main.listLocalUserSyncStates();
      logger.info({ scope: 'auth', payload }, 'Syncing users with sync server');

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
        return data;
      }

      logger.info({ scope: 'auth', data }, 'Received user sync delta from sync server');
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
          logger.info({ scope: 'auth', userId: user.id }, 'Upserted user from sync delta');
        }
        for (const deletedUserId of data.deletedUserIds) {
          authDb.main.deleteLocalUser(deletedUserId);
          logger.info({ scope: 'auth', userId: deletedUserId }, 'Deleted user from sync delta');
        }
      });

      logger.info({ scope: 'auth' }, 'Users synced successfully with sync server');
      return { success: true, message: 'Users synced successfully' };
    } catch (error) {
      logger.error({ scope: 'auth', error }, 'Error syncing users with sync server');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred while syncing users',
      };
    }
  });
};
