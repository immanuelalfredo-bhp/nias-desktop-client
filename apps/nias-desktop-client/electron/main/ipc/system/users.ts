import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import {
  isSuccess,
  handleResponse,
  logger,
  type Envelope,
  hashPassword,
} from '@nias/shared/server';
import { UserDatabase, AuthDatabase } from '../../db/database';
import { createAuditLog } from './audit';
import { resolveUserAccessToken } from '../sync.js';
import { SYNC_SERVER_URL } from '../../config';

export function registerUserIpcHandlers(
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void {
  ipcMain.handle('user:list-active', async (_event): Promise<Envelope<system.User[]>> => {
    try {
      const users = userDb.user.listActive();
      logger.info(
        { scope: 'user', userCount: users.length },
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
          scope: 'user',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
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
      const users = userDb.user.listDeleted();
      logger.info(
        { scope: 'user', userCount: users.length },
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
          scope: 'user',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
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
    'user:get-by-id',
    async (_event, userId: string): Promise<Envelope<system.User>> => {
      try {
        const user = userDb.user.getById(userId);
        if (!user) {
          logger.error({ scope: 'user', userId }, 'User not found');
          return {
            success: false,
            message: 'User not found',
          };
        }
        logger.info({ scope: 'user', userId }, 'User retrieved successfully');
        return {
          success: true,
          message: 'User retrieved successfully',
          data: user,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'user',
            userId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve user',
        );
        return {
          success: false,
          message: 'Failed to retrieve user',
        };
      }
    },
  );

  ipcMain.handle('user:get-self', async (): Promise<Envelope<system.User>> => {
    try {
      const user = userDb.user.getById(userId);
      if (!user) {
        logger.error({ scope: 'user', userId }, 'Current user not found');
        return {
          success: false,
          message: 'Current user not found',
        };
      }

      return {
        success: true,
        message: 'Current user retrieved successfully',
        data: user,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'user',
          userId,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve current user',
      );
      return {
        success: false,
        message: 'Failed to retrieve current user',
      };
    }
  });

  ipcMain.handle(
    'user:create',
    async (_event, payload: system.CreateUserInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateUserInputSchema.parse(payload);
        const passwordHash = await hashPassword(parsed.password);
        const jwtToken = await resolveUserAccessToken(authDb, userId);

        const serverPayload: system.CreateUserPayload = {
          displayName: parsed.displayName,
          email: parsed.email,
          isManagedBy: parsed.isManagedBy,
          password: parsed.password, // Include the password for server-side processing
          passwordHash: passwordHash,
        };

        // Send the request to the sync server to create the user
        const response = await fetch(`${SYNC_SERVER_URL}/api/database/create-user`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(serverPayload),
        });

        const data = await handleResponse(response, system.CreateUserResponseSchema, 'user');
        if (!isSuccess(data)) {
          return { success: false, message: 'User creation failed' };
        }
        logger.info({ scope: 'user', userId: data.id }, 'User created successfully on sync server');

        try {
          userDb.user.transaction(() => {
            // Upsert the user into the local database
            userDb.user.upsert({
              id: data.id,
              displayName: parsed.displayName,
              email: parsed.email,
              passwordHash: passwordHash,
              isManagedBy: parsed.isManagedBy ?? null,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: null,
              isSynced: true,
              syncVersion: data.syncVersion,
            });
            logger.info(
              { scope: 'user', userId: data.id },
              'User upserted successfully in local database',
            );

            createAuditLog(userDb, userId, {
              action: 'create',
              tableName: 'users',
              recordName: parsed.displayName,
              recordId: data.id,
            });
            logger.info({ scope: 'audit', userId: data.id }, 'Audit log created for user creation');
          });
        } catch (error) {
          logger.error(
            {
              scope: 'user',
              userId: data.id,
              errorMessage: (error as Error).message,
              errorStack: (error as Error).stack,
              rawError: error,
            },
            'Failed to upsert user in local database',
          );
          return {
            success: false,
            message: 'Failed to upsert user in local database',
          };
        }

        return {
          success: true,
          message: 'User created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'user',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create user',
        );
        return {
          success: false,
          message: 'Failed to create user',
        };
      }
    },
  );

  ipcMain.handle(
    'user:update',
    async (_event, payload: system.UpdateUserInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateUserInputSchema.parse(payload);
        const existing = userDb.user.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'user', userId: parsed.id }, 'User not found for update');
          return {
            success: false,
            message: 'User not found for update',
          };
        }

        const passwordHash = parsed.password ? await hashPassword(parsed.password) : undefined;
        const jwtToken = await resolveUserAccessToken(authDb, userId);

        const serverPayload: system.UpdateUserPayload = {
          id: parsed.id,
          displayName: parsed.displayName,
          email: parsed.email,
          isManagedBy: parsed.isManagedBy ?? existing.isManagedBy ?? null,
          ...(parsed.password ? { password: parsed.password, passwordHash } : {}),
        };

        const response = await fetch(`${SYNC_SERVER_URL}/api/database/update-user`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(serverPayload),
        });

        const data = await handleResponse(response, system.UpdateUserResponseSchema, 'user');
        if (!isSuccess(data)) {
          return { success: false, message: data.message || 'User update failed' };
        }

        userDb.user.upsert({
          ...existing,
          email: parsed.email ?? existing.email,
          displayName: parsed.displayName ?? existing.displayName,
          isManagedBy: parsed.isManagedBy ?? existing.isManagedBy ?? null,
          passwordHash: passwordHash ?? existing.passwordHash,
          updatedAt: data.updatedAt,
          syncVersion: data.syncVersion,
          isSynced: true,
        });
        logger.info({ scope: 'user', userId: parsed.id }, 'User updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'users',
          recordName: parsed.displayName || existing.displayName,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', userId: parsed.id }, 'Audit log created for user update');

        return {
          success: true,
          message: 'User updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'user',
            userId: payload.id,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update user',
        );
        return {
          success: false,
          message: 'Failed to update user',
        };
      }
    },
  );

  ipcMain.handle('user:delete', async (_event, userId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.user.getById(userId);
      if (!existing) {
        logger.error({ scope: 'user', userId }, 'User not found for deletion');
        return {
          success: false,
          message: 'User not found for deletion',
        };
      }
      userDb.user.delete(userId);
      logger.info({ scope: 'user', userId }, 'User deleted successfully');

      createAuditLog(userDb, userId, {
        action: 'delete',
        tableName: 'users',
        recordName: existing.displayName,
        recordId: userId,
      });
      logger.info({ scope: 'audit', userId }, 'Audit log created for user deletion');

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'user',
          userId,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to delete user',
      );
      return {
        success: false,
        message: 'Failed to delete user',
      };
    }
  });

  ipcMain.handle(
    'user:restore',
    async (_event, userId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.user.getById(userId);
        if (!existing) {
          logger.error({ scope: 'user', userId }, 'User not found for restoration');
          return {
            success: false,
            message: 'User not found for restoration',
          };
        }
        userDb.user.restore(userId);
        logger.info({ scope: 'user', userId }, 'User restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'users',
          recordName: existing.displayName,
          recordId: userId,
        });
        logger.info({ scope: 'audit', userId }, 'Audit log created for user restoration');

        return {
          success: true,
          message: 'User restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'user',
            userId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore user',
        );
        return {
          success: false,
          message: 'Failed to restore user',
        };
      }
    },
  );

  ipcMain.handle(
    'user:upsert',
    async (_event, payload: system.User[]): Promise<common.SuccessResponse> => {
      try {
        userDb.user.transaction(() => {
          for (const user of payload) {
            const parsed = system.UserSchema.parse(user);
            userDb.user.upsert(parsed);
            logger.info({ scope: 'user', userId: parsed.id }, 'User upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'users',
              recordName: parsed.displayName,
              recordId: parsed.id,
            });
            logger.info({ scope: 'audit', userId: parsed.id }, 'Audit log created for user upsert');
          }
        });
        return {
          success: true,
          message: 'Users upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'user',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert users',
        );
        return {
          success: false,
          message: 'Failed to upsert users',
        };
      }
    },
  );
}
