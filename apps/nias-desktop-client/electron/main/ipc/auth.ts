import { ipcMain } from 'electron';
import { AuthDatabase } from '../db/database.js';

export const registerAuthIpcHandlers = (authDb: AuthDatabase): void => {
  ipcMain.handle('auth:status', async () => {
    const userCount = authDb.main.countLocalUsers();
    const isEmpty = userCount === 0;
    console.log('User count:', userCount);
    console.log('DEBUG: Returning isEmpty as', isEmpty);
    return { isEmpty: userCount === 0 };
  });
}