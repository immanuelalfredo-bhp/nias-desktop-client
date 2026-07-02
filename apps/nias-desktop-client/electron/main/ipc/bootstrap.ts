import crypto from 'node:crypto';
import { ipcMain } from 'electron';
import{ sharedSync } from '@nias/shared';
import { SYNC_SERVER_URL } from '../config.js';
import { hashPassword, slugify } from '@nias/shared/src/utils.js';
import { AuthDatabase } from '../db/database.js';

export function registerBootstrapIpcHandlers(authDb: AuthDatabase): void {
  ipcMain.handle('bootstrap:status', async (event, bootstrapSecret: string) => {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/status`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'bootstrap-secret': bootstrapSecret,
        },
      });

      if (!response.ok) {
        if (response.status === 401) return { success: false, isValid: false }; // Token issue
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
    console.error('Bootstrap IPC Error:', err);
    throw err; 
  }
  });

  ipcMain.handle('bootstrap:execute', async (event, bootstrapSecret: string, payload: any) => {
    try {
      const adminId = crypto.randomUUID();
      const payloadId = crypto.randomUUID();
      const passwordHash = await hashPassword(payload.password);

      const payloadData: sharedSync.PushPayload = {
        id: payloadId,
        actorId: adminId,
        changes: [
          {
            id: payloadId,
            tableName: 'users',
            payload: {
              id: adminId,
              username: slugify(payload.username),
              passwordHash: passwordHash,
              displayName: payload.displayName,
              email: payload.email,
            }
          }
        ]
      };

      const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/execute`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'bootstrap-secret': bootstrapSecret,
        },
        body: JSON.stringify(payloadData),
      });

      const result = await response.json() as any;
      
      if (!response.ok) {
        throw new Error(result.error || 'Bootstrap execution failed');
      }

      authDb.main.insertBootstrapUser({
        adminId: adminId,
        username: slugify(payload.username),
        passwordHash: passwordHash,
        syncVersion: 1
      });

      return {success: true, adminId: adminId, result: result};
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
