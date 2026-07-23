import Database from 'better-sqlite3-multiple-ciphers';
import { order } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  project_id as projectId,
  user_id as userId,
  comments,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RequestQueries extends BaseQueries<
  order.Request,
  order.CreateRequest,
  order.UpdateRequest
> {
  constructor(db: Database.Database) {
    super(db, 'requests', COLUMNS);
  }
  create(params: order.CreateRequest): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO requests (
          id, project_id, user_id, comments, created_at, updated_at) 
        VALUES (
          @id, @projectId, @userId, @comments, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: order.UpdateRequest): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE requests SET 
          project_id = @projectId, user_id = @userId, comments = @comments, 
          updated_at = @updatedAt, is_synced = @isSynced WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: order.Request): void {
    this.db
      .prepare(
        `
        INSERT INTO requests (
          id, project_id, user_id, comments, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @projectId, @userId, @comments, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          project_id = excluded.project_id,
          user_id = excluded.user_id,
          comments = excluded.comments,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
