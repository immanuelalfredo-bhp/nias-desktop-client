import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from '@nias/shared/server';

export const registerUpdateIpcHandlers = (): void => {
  ipcMain.handle('update:check', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        message: 'Update checks are only available in packaged builds.',
      };
    }

    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      logger.error({ scope: 'update', error }, 'Failed to check for updates');
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('update:download', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        message: 'Update downloads are only available in packaged builds.',
      };
    }

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
