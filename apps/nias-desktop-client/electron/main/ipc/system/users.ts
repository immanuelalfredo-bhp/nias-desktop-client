import { system, common } from '@nias/shared';
import {
  hashPassword,
  isSuccess,
  handleResponse,
  logger,
} from '@nias/shared/server';
import { AuthDatabase, UserDatabase } from '../../db/database';
import { SYNC_SERVER_URL } from '../../config';
import { createAuditLog, registerGenericIpcHandlers } from '../../utils.js';
import { resolveUserJwtToken } from '../auth-session.js';

export function registerUserIpcHandlers(
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void {
  registerGenericIpcHandlers(
    'user',
    userDb.user,
    {
      create: system.CreateUserInputSchema,
      update: system.UpdateUserInputSchema,
      id: system.DeleteUserSchema,
    },
    (id: string) => {
      const user = userDb.user.getById(id);
      return user ? user.displayName : 'Unknown User';
    },
    () => {
      const user = userDb.user.getUserById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'users', recordId: id, details });
    },
    {
      actions: {
        getById: true,
        create: true,
        update: false,
        delete: false,
        restore: false,
        listActive: true,
        listDeleted: true,
      },
      create: async (payload): Promise<common.SuccessResponse> => {
        const hashedPassword = await hashPassword(payload.password);
        const serverPayload: system.CreateUserPayload = {
          ...payload,
          passwordHash: hashedPassword,
        };

        const jwtToken = await resolveUserJwtToken(authDb, userId);
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
          userDb.user.create({
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
          createAuditLog(userDb, userId, {
            action: 'create',
            tableName: 'users',
            recordId: data.id,
            details: `${payload.displayName} created`,
          });
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
    },
  );
}
