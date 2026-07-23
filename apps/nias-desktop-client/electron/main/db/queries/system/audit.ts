import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  user_id AS userId,
  action,
  table_name AS tableName,
  record_id AS recordId,
  timestamp,
  details,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class AuditQueries extends BaseQueries<system.Audit, system.CreateAudit, void> {
  constructor(db: Database.Database) {
    super(db, 'audit', COLUMNS);
  }
  create(params: system.CreateAudit): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO audit (
          id, user_id, action, table_name, record_id, timestamp, details) 
        VALUES (
          @id, @userId, @action, @tableName, @recordId, @timestamp, @details)`,
      )
      .run({ ...params, timestamp: now });
  }
  upsert(params: system.Audit): void {
    this.db
      .prepare(
        `
        INSERT INTO audit (
          id, user_id, action, table_name, record_id, timestamp, details,
          is_synced, sync_version) 
        VALUES (
          @id, @userId, @action, @tableName, @recordId, @timestamp, @details,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          action = excluded.action,
          table_name = excluded.table_name,
          record_id = excluded.record_id,
          timestamp = excluded.timestamp,
          details = excluded.details,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
  update(): void {} // Not implemented for audits
}
