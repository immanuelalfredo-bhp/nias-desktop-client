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
        const response = await fetch(`${SYNC_SERVER_URL}/api/database/new-user`, {
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
          userDb.user.transaction(async () => {
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
    async (_event, payload: system.UpdateUser): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateUserSchema.parse(payload);
        const existing = userDb.user.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'user', userId: parsed.id }, 'User not found for update');
          return {
            success: false,
            message: 'User not found for update',
          };
        }

        const updatedData: system.UpdateUser = {
          id: parsed.id,
          displayName: parsed.displayName,
          email: parsed.email,
          isManagedBy: parsed.isManagedBy,
        };

        userDb.user.update(updatedData);
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

  ipcMain.handle(
    'user:update-self',
    async (_event, payload: system.UpdateSelfInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateSelfInputSchema.parse(payload);
        const existing = userDb.user.getById(userId);
        if (!existing) {
          logger.error({ scope: 'user', userId }, 'User not found for self-update');
          return {
            success: false,
            message: 'User not found for self-update',
          };
        }

        const updatedData: system.UpdateUser = {
          id: userId,
          displayName: parsed.displayName,
          email: parsed.email,
          isManagedBy: existing.isManagedBy,
        };
        userDb.user.update(updatedData);
        logger.info({ scope: 'user', userId }, 'User updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'users',
          recordName: updatedData.displayName || existing.displayName,
          recordId: userId,
        });
        logger.info({ scope: 'audit', userId }, 'Audit log created for user self-update');

        return {
          success: true,
          message: 'User updated successfully',
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
          'Failed to update user',
        );
        return {
          success: false,
          message: 'Failed to update user',
        };
      }
    },
  );

  ipcMain.handle(
    'user:update-password',
    async (_event, payload: system.UpdateUserPasswordInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateUserPasswordInputSchema.parse(payload);
        const existing = userDb.user.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'user', userId: parsed.id }, 'User not found for password update');
          return {
            success: false,
            message: 'User not found for password update',
          };
        }
        const passwordHash = await hashPassword(parsed.password);
        const jwtToken = await resolveUserAccessToken(authDb, parsed.id);

        // Send the request to the sync server to update the user's password
        const serverPayload: system.UpdateUserPasswordPayload = {
          id: parsed.id,
          password: parsed.password,
          passwordHash: passwordHash,
        };

        const response = await fetch(`${SYNC_SERVER_URL}/api/database/update-password`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(serverPayload),
        });

        const data = await handleResponse(
          response,
          system.UpdateUserPasswordResponseSchema,
          'user',
        );
        if (!isSuccess(data)) {
          return { success: false, message: 'User password update failed' };
        }
        logger.info(
          { scope: 'user', userId: parsed.id },
          'User password updated successfully on sync server',
        );

        // Update the password in the local database within a transaction
        try {
          userDb.user.transaction(() => {
            userDb.user.updatePassword({
              id: parsed.id,
              passwordHash,
              updatedAt: data.updatedAt,
              isSynced: true,
              syncVersion: data.syncVersion,
            });
            logger.info({ scope: 'user', userId: parsed.id }, 'User password updated successfully');

            createAuditLog(userDb, parsed.id, {
              action: 'update-password',
              tableName: 'users',
              recordName: existing.displayName,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', userId: parsed.id },
              'Audit log created for user password update',
            );
          });
        } catch (error) {
          logger.error(
            {
              scope: 'user',
              userId: parsed.id,
              errorMessage: (error as Error).message,
              errorStack: (error as Error).stack,
              rawError: error,
            },
            'Failed to update user password in local database',
          );
          return {
            success: false,
            message: 'Failed to update user password in local database',
          };
        }

        const authUser = authDb.main.getById(parsed.id);
        // only update the password in the auth database if the user exists there
        if (!authUser) {
          logger.warn(
            { scope: 'auth', userId: parsed.id },
            'User not found in auth database, skipping password update',
          );
        } else {
          try {
            if (authUser) {
              // Update the password in the auth database
              authDb.main.updatePasswordHash(parsed.id, passwordHash, data.syncVersion);
              logger.info(
                { scope: 'auth', userId: parsed.id },
                'User password updated successfully in auth database',
              );
            }
          } catch (error) {
            logger.error(
              {
                scope: 'auth',
                userId: parsed.id,
                errorMessage: (error as Error).message,
                errorStack: (error as Error).stack,
                rawError: error,
              },
              'Failed to update user password in auth database',
            );
            return {
              success: false,
              message: 'Failed to update user password in auth database',
            };
          }
        }
        return {
          success: true,
          message: 'User password updated successfully',
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
          'Failed to update user password',
        );
        return {
          success: false,
          message: 'Failed to update user password',
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
