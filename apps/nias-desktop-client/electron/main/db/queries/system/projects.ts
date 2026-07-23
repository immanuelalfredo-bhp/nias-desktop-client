import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  name,
  normalized_name as normalizedName,
  so_number as soNumber,
  po_number as poNumber,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class ProjectQueries extends BaseQueries<system.Project, system.CreateProject, system.UpdateProject> {
  constructor(db: Database.Database) {
    super(db, 'projects', COLUMNS);
  }
  create(params: system.CreateProject): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO projects (
          id, name, normalized_name, so_number, po_number, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @soNumber, @poNumber, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: system.UpdateProject): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE projects SET
          name = @name, normalized_name = @normalizedName, so_number = @soNumber, po_number = @poNumber,
          updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: system.Project): void {
    this.db
      .prepare(
        `
        INSERT INTO projects (
          id, name, normalized_name, so_number, po_number, created_at, updated_at, deleted_at,
          is_synced, sync_version) 
        VALUES (
          @id, @name, @normalizedName, @soNumber, @poNumber, @createdAt, @updatedAt, @deletedAt,
          @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          so_number = excluded.so_number,
          po_number = excluded.po_number,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run({ ...params, isSynced: params.isSynced ? 1 : 0 });
  }
}
