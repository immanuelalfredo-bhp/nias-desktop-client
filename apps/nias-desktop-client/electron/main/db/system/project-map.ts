import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  user_id as userId,
  project_id as projectId,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class ProjectMapQueries extends BaseQueries<
  system.ProjectMap,
  system.CreateProjectMap,
  system.UpdateProjectMap
> {
  constructor(db: Database.Database) {
    super(db, 'project_map', COLUMNS);
  }
  create(params: system.CreateProjectMap): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO project_map (
          id, user_id, project_id, created_at, updated_at) 
        VALUES (
          @id, @userId, @projectId, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateProjectMap): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE project_map SET
          user_id = @userId, project_id = @projectId,
          updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.ProjectMap): void {
    this.db
      .prepare(
        `
        INSERT INTO project_map (
          id, user_id, project_id, created_at, updated_at, deleted_at,
          is_synced, sync_version) 
        VALUES (
          @id, @userId, @projectId, @createdAt, @updatedAt, @deletedAt,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          project_id = excluded.project_id,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
