import { ipcMain } from 'electron';
import {
  logger,
  verifyPassword,
  hashPassword,
  isSuccess,
  handleResponse,
  type Envelope,
} from '@nias/shared/server';
import { local, common } from '@nias/shared';
import { AuthDatabase } from '../db/database.js';
import { APP_ID, SYNC_SERVER_URL } from '../config.js';

export const registerAuthIpcHandlers = (authDb: AuthDatabase): void => {
  ipcMain.handle('auth:status', async (_event): Promise<Envelope<local.BootstrapStatus>> => {
    const userCount = authDb.main.count();
    return {
      success: true,
      message: 'Local auth bootstrap status retrieved successfully',
      data: {
        isEmpty: userCount === 0,
      },
    };
  });

  ipcMain.handle(
    'auth:login',
    async (_event, payload: local.Login): Promise<common.SuccessResponse> => {
      try {
        const parsed = local.LoginSchema.parse(payload);
        const user = authDb.main.getByEmail(parsed.email);

        if (!user) {
          try {
            logger.warn({ scope: 'auth', email: parsed.email }, 'Login failed: User not found');
            const response = await fetch(`${SYNC_SERVER_URL}/api/login/initial`, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'app-id': `${APP_ID}`,
              },
              body: JSON.stringify(parsed),
            });

            logger.info({ scope: 'auth', email: parsed.email }, 'Fetching user from sync server');
            logger.debug(
              { scope: 'auth', email: parsed.email, responseStatus: response.status },
              'Received response from sync server',
            );
            logger.debug(
              { scope: 'auth', email: parsed.email, responseBody: await response.clone().text() },
              'Response body from sync server',
            );
            logger.debug(
              { scope: 'auth', email: parsed.email, responseHeaders: response.headers },
              'Response headers from sync server',
            );
            logger.debug(
              { scope: 'auth', email: parsed.email, responseOk: response.ok },
              'Response ok status from sync server',
            );
            const data = await handleResponse(response, local.LoginResponseSchema, 'auth');
            if (!isSuccess(data)) {
              return data;
            }
            logger.info(
              { scope: 'auth', userId: data.id },
              'User fetched successfully from sync server',
            );

            const hashedPassword = await hashPassword(parsed.password);

            authDb.main.transaction(() => {
              authDb.main.upsert({
                id: data.id,
                email: parsed.email,
                passwordHash: hashedPassword,
                syncVersion: data.syncVersion,
              });
              authDb.main.updateTokens(
                data.id,
                data.accessToken,
                data.refreshToken,
                data.expiresAt,
              );
            });
            logger.info({ scope: 'auth', userId: data.id }, 'User fetched and stored successfully');

            return { success: true, message: 'User fetched and stored successfully' };
          } catch (error) {
            logger.error({ scope: 'auth', error }, 'Error during login');
            return {
              success: false,
              message: error instanceof Error ? error.message : 'An error occurred during login',
            };
          }
        }

        if (!user.passwordHash) {
          logger.warn(
            { scope: 'auth', userId: user.id },
            'Login failed: User has no password hash',
          );
          return { success: false, message: 'User has no password hash' };
        }

        const isPasswordValid = await verifyPassword(parsed.password, user.passwordHash);
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
      const payload = authDb.main.getSyncVersion();
      logger.info({ scope: 'auth', payload }, 'Syncing users with sync server');

      const response = await fetch(`${SYNC_SERVER_URL}/api/login/sync`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'app-id': `${APP_ID}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response, local.UserSyncDeltaSchema, 'auth');
      if (!isSuccess(data)) {
        return data;
      }
      logger.info({ scope: 'auth', data }, 'Received user sync delta from sync server');

      authDb.main.transaction(() => {
        for (const user of data.upsert) {
          authDb.main.upsert({
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            syncVersion: user.syncVersion,
          });
          logger.info({ scope: 'auth', userId: user.id }, 'Upserted user from sync delta');
        }
        for (const deletedUserId of data.delete) {
          authDb.main.delete(deletedUserId);
          logger.info({ scope: 'auth', userId: deletedUserId }, 'Deleted user from sync delta');
        }
      });
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

export const registerBootstrapIpcHandlers = (): void => {
  ipcMain.handle('bootstrap:status', async (_event): Promise<Envelope<local.BootstrapStatus>> => {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/status`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'app-id': `${APP_ID}`,
        },
      });
      const data = await handleResponse(response, local.BootstrapStatusSchema, 'bootstrap');
      if (!isSuccess(data)) {
        return data as Envelope<local.BootstrapStatus>;
      }
      logger.info({ scope: 'bootstrap', data }, 'Received bootstrap status from sync server');
      return { success: true, message: 'Bootstrap status retrieved successfully', data };
    } catch (error) {
      logger.error(
        { scope: 'bootstrap', error },
        'Error retrieving bootstrap status from sync server',
      );
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while retrieving bootstrap status',
      };
    }
  });

  ipcMain.handle(
    'bootstrap:execute',
    async (_event, payload: local.BootstrapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = local.BootstrapInputSchema.parse(payload);
        const passwordHash = await hashPassword(parsed.password);

        const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/execute`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'bootstrap-secret': `${parsed.bootstrapKey}`,
          },
          body: JSON.stringify({
            displayName: parsed.displayName,
            email: parsed.email,
            password: parsed.password,
            passwordHash,
          }),
        });

        const data = await handleResponse(response, common.EntityIdSchema, 'bootstrap');
        if (!isSuccess(data)) {
          return data;
        }

        logger.info({ scope: 'bootstrap', userId: data.id }, 'Bootstrap executed successfully');
        return { success: true, message: 'Bootstrap completed successfully' };
      } catch (error) {
        logger.error({ scope: 'bootstrap', error }, 'Bootstrap execution failed');
        return {
          success: false,
          message: 'Bootstrap execution failed. Please check the logs for more details.',
        };
      }
    },
  );
};
