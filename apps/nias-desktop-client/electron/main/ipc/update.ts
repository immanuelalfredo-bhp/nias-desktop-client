import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from '@nias/shared/server';

export const registerUpdateIpcHandlers = (): void => {
  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      logger.error({ scope: 'update', error }, 'Failed to check for updates');
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      logger.error({ scope: 'update', error }, 'Failed to download update');
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('update:quit-and-install', async () => {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      logger.error({ scope: 'update', error }, 'Failed to quit and install update');
      return { success: false, message: (error as Error).message };
    }
  });
};
