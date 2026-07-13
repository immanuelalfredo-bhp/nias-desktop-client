import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import {
  hashPassword,
  isSuccess,
  handleResponse,
  logger,
  type Envelope,
} from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { SYNC_SERVER_URL } from '../../config';

export function registerUserIpcHandlers(userDb: UserDatabase, jwtToken?: string): void {
  ipcMain.handle('user:list-active', async (_event): Promise<Envelope<system.User[]>> => {
    try {
      const users = userDb.user.listUsers();
      logger.info(
        { scope: 'users', userCount: users.length },
        'Active users retrieved successfully',
      );
      return {
        success: true,
        message: 'Active users retrieved successfully',
        data: users,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'users',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active users',
      );
      return {
        success: false,
        message: 'Failed to retrieve active users',
      };
    }
  });

  ipcMain.handle('user:list-deleted', async (_event): Promise<Envelope<system.User[]>> => {
    try {
      const users = userDb.user.listDeletedUsers();
      logger.info(
        { scope: 'users', userCount: users.length },
        'Deleted users retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted users retrieved successfully',
        data: users,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'users',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted users',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted users',
      };
    }
  });

  ipcMain.handle(
    'user:create',
    async (_event, payload: system.CreateUserPayload): Promise<common.SuccessResponse> => {
      const hashedPassword = await hashPassword(payload.password);
      const serverPayload: system.CreateUserPayload = {
        ...payload,
        passwordHash: hashedPassword,
      };

      if (!jwtToken) {
        logger.error({ scope: 'users' }, 'User creation failed: missing JWT token');
        return { success: false, message: 'User creation failed: missing JWT token' };
      }

      const respose = await fetch(`${SYNC_SERVER_URL}/api/database/new-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(serverPayload),
      });

      const data = await handleResponse(respose, system.CreateUserResponseSchema, 'users');
      if (!isSuccess(data)) {
        return { success: false, message: 'User creation failed' };
      }

      try {
        userDb.user.createUser({
          id: data.id,
          displayName: payload.displayName,
          email: payload.email,
          passwordHash: hashedPassword,
          isManagedBy: payload.isManagedBy ?? null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          deletedAt: null,
          isSynced: true,
          syncVersion: data.syncVersion,
        });
        logger.info(
          { scope: 'users', userId: data.id },
          'User created successfully and stored locally',
        );
      } catch (error) {
        logger.error(
          {
            scope: 'users',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create user locally',
        );
      }

      return { success: true, message: 'User created successfully' };
    },
  );
}
