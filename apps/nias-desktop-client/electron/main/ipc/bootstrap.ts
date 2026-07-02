import crypto from 'node:crypto';
import { ipcMain } from 'electron';
import { hashPassword, sharedAuth, sharedSync, slugify } from '@nias/shared';
import { SYNC_SERVER_URL } from '../config.js';
import { AuthDatabase } from '../db/database.js';

interface BootstrapStatusResponse {
  isEmpty: boolean;
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function registerBootstrapIpcHandlers(authDb: AuthDatabase): void {
  ipcMain.handle('bootstrap:status', async (_event, bootstrapSecret: string) => {
    try {
      const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/status`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'bootstrap-secret': bootstrapSecret,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, isEmpty: false, isValid: false };
        }

        throw new Error(`Server returned ${response.status}`);
      }

      const data = (await response.json()) as BootstrapStatusResponse;
      return { success: true, isEmpty: data.isEmpty, isValid: true };
    } catch (err) {
      console.error('Bootstrap IPC error:', err);
      throw err;
    }
  });

  ipcMain.handle(
    'bootstrap:execute',
    async (_event, bootstrapSecret: string, payload: unknown) => {
    try {
      const bootstrapAccount = sharedAuth.BootstrapAccountSchema.parse(payload);
      const adminId = crypto.randomUUID();
      const payloadId = crypto.randomUUID();
      const passwordHash = await hashPassword(bootstrapAccount.password);

      const payloadData: sharedSync.PushPayload = {
        id: payloadId,
        actorId: adminId,
        changes: [
          {
            id: payloadId,
            tableName: 'users',
            payload: {
              id: adminId,
              username: slugify(bootstrapAccount.username),
              passwordHash,
              displayName: bootstrapAccount.displayName,
              email: bootstrapAccount.email,
            },
          },
        ],
      };

      const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/execute`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'bootstrap-secret': bootstrapSecret,
        },
        body: JSON.stringify(payloadData),
      });

      const result = (await response.json()) as ErrorResponseBody;

      if (!response.ok) {
        throw new Error(
          result.error ?? result.message ?? 'Bootstrap execution failed'
        );
      }

      authDb.main.insertBootstrapUser({
        adminId,
        username: slugify(bootstrapAccount.username),
        passwordHash,
        syncVersion: 1,
      });

      return { success: true, message: 'Bootstrap completed successfully' };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Unknown error'),
      };
    }
    }
  );
}
