import { ipcMain } from 'electron';
import { UserDatabase } from '../db/database';
import { logger } from '@nias/shared/server';

export const registerSyncIpcHandlers = (userDb: UserDatabase): void => {
  ipcMain.handle('sync:fetch-version', async (_event): Promise<any> => {
    try {
      const syncVersion = userDb.sync.fetchSyncVersion();
      logger.info({ scope: 'sync', version: syncVersion }, 'Sync version fetched successfully');
      return {
        success: true,
        message: 'Sync version fetched successfully',
        syncVersion,
      };
    } catch (error) {
      logger.error({ scope: 'sync', error }, 'Failed to fetch sync version');
      return {
        success: false,
        message: 'Failed to fetch sync version',
      };
    }
  });
};
