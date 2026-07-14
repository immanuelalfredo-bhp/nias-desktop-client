import { ipcMain } from 'electron';
import { system } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';

export function registerAuditIpcHandlers(userDb: UserDatabase): void {
  ipcMain.handle('audit:list', async (_event): Promise<Envelope<system.Audit[]>> => {
    try {
      const auditLogs = userDb.audit.listAuditLogs();
      logger.info(
        { scope: 'audit', auditLogCount: auditLogs.length },
        'Audit logs retrieved successfully',
      );
      return {
        success: true,
        message: 'Audit logs retrieved successfully',
        data: auditLogs,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'audit',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve audit logs',
      );
      return {
        success: false,
        message: 'Failed to retrieve audit logs',
      };
    }
  });
}
