import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import type { UserDatabase } from '../../db/database';

export function registerAuditIpcHandlers(userDb: UserDatabase): void {
  ipcMain.handle('audit:list', async (_event): Promise<Envelope<system.Audit[]>> => {
    try {
      const auditLogs = userDb.audit.listActive();
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
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
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

export function createAuditLog(
  userDb: UserDatabase,
  userId: string,
  payload: system.CreateAuditInput,
): common.SuccessResponse {
  try {
    const actor = userDb.user.getById(userId);
    if (!actor) {
      logger.error(
        {
          scope: 'audit',
          userId: userId,
        },
        'Failed to create audit log: Acting user not found. Sync user data.',
      );
      throw new Error('Acting user not found. Sync user data.');
    }

    const newAuditLog: system.CreateAudit = {
      id: crypto.randomUUID(),
      userId: userId,
      action: payload.action,
      tableName: payload.tableName,
      recordId: payload.recordId,
      timestamp: new Date().toISOString(),
      details: `${actor.displayName} ${payload.action}ed ${payload.recordName} in ${payload.tableName}`,
    };

    userDb.audit.create(newAuditLog);
    logger.info({ scope: 'audit', auditLogId: newAuditLog.id }, 'Audit log created successfully');
    return { success: true, message: 'Audit log created successfully' };
  } catch (error) {
    logger.error(
      {
        scope: 'audit',
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Failed to create audit log',
    );
    throw new Error('Failed to create audit log');
  }
}
