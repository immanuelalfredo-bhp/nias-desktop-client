import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
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

  ipcMain.handle(
    'audit:create',
    async (_event, payload: system.CreateAuditInput): Promise<common.SuccessResponse> => {
      try {
        const newAuditLog: system.Audit = {
          id: crypto.randomUUID(),
          userId: payload.userId,
            action: payload.action,
            tableName: payload.tableName,
            recordId: payload.recordId,
            timestamp: new Date().toISOString(),
            details: payload.details,
            isSynced: false,
            syncVersion: 0,
        };
        userDb.audit.createAuditLog(newAuditLog);
        logger.info({ scope: 'audit', auditLogId: newAuditLog.id }, 'Audit log created successfully');
        return { success: true, message: 'Audit log created successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'audit',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create audit log',
        );
        return { success: false, message: 'Failed to create audit log' };
      }
    },
  );
}