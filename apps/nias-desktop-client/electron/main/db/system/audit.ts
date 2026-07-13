import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class AuditQueries {
  constructor(private readonly db: Database.Database) {}

  listAuditLogs(): system.Audit[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        user_id AS userId,
        action,
        table_name AS tableName,
        record_id AS recordId,
        timestamp,
        details
        FROM audit_logs
        ORDER BY timestamp DESC
    `);
    logger.debug({ scope: 'AuditQueries' }, 'listAuditLogs: SQL query executed successfully.');
    return stmt.all() as system.Audit[];
  }

  createAuditLog(params: system.Audit): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        id,
        user_id,
        action,
        table_name,
        record_id,
        timestamp,
        details
        ) VALUES (
            @id,
            @userId,
            @action,
            @tableName,
            @recordId,
            @timestamp,
            @details
        )
    `);
    stmt.run({
      id: params.id,
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      timestamp: params.timestamp,
      details: params.details,
    });
    logger.debug({ scope: 'AuditQueries' }, 'createAuditLog: SQL query executed successfully.');
  }
}
