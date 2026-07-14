import type { UserDatabase } from './db/database';
import { system, common } from '@nias/shared';
import { logger } from '@nias/shared/server';

export function createAuditLog(
  userDb: UserDatabase,
  userId: string,
  payload: system.CreateAuditInput,
): common.SuccessResponse {
  try {
    const actor = userDb.user.getUserById(userId);
    if (!actor) {
      logger.error(
        {
          scope: 'audit',
          userId: userId,
        },
        'Failed to create audit log: Acting user not found. Sync user data.',
      );
      return {
        success: false,
        message: 'Failed to create audit log: Acting user not found. Sync user data.',
      };
    }

    const newAuditLog: system.CreateAudit = {
      id: crypto.randomUUID(),
      userId: userId,
      action: payload.action,
      tableName: payload.tableName,
      recordId: payload.recordId,
      timestamp: new Date().toISOString(),
      details: payload.details,
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
}
