import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  scope,
  name,
  normalized_name AS normalizedName,
  form_name AS formName,
  position,
  sort_order AS sortOrder,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class DimensionQueries extends BaseQueries<
  attribute.Dimension,
  attribute.CreateDimension,
  attribute.UpdateDimension
> {
  constructor(db: Database.Database) {
    super(db, 'dimensions', COLUMNS);
  }
  create(params: attribute.CreateDimension): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO dimensions (
          id, scope, name, normalized_name, form_name, position, sort_order, created_at, updated_at) 
        VALUES (
          @id, @scope, @name, @normalizedName, @formName, @position, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateDimension): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE dimensions SET name = @name, normalized_name = @normalizedName, form_name = @formName, 
        position = @position, sort_order = @sortOrder, updated_at = @updatedAt, is_synced = @isSynced
        WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: attribute.Dimension): void {
    this.db
      .prepare(
        `
        INSERT INTO dimensions (
          id, scope, name, normalized_name, form_name, position, sort_order, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @scope, @name, @normalizedName, @formName, @position, @sortOrder, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          scope = excluded.scope,
          name = excluded.name,
          normalized_name = excluded.normalized_name,
          form_name = excluded.form_name,
          position = excluded.position,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
