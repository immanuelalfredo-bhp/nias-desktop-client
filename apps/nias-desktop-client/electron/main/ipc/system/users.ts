import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { hashPassword, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';

export function registerUserIpcHandlers(userDb: UserDatabase): void {
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
}
