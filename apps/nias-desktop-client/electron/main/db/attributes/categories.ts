import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
	id,
	name,
	normalized_name AS normalizedName,
	sort_order AS sortOrder,
	created_at AS createdAt,
	updated_at AS updatedAt,
	deleted_at AS deletedAt,
	is_synced AS isSynced,
	sync_version AS syncVersion`;

export class CategoryQueries extends BaseQueries<
  attribute.Category,
  attribute.CreateCategory,
  attribute.UpdateCategory
> {
  constructor(db: Database.Database) {
    super(db, 'categories', COLUMNS);
  }
  create(params: attribute.CreateCategory): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO categories (
          id, name, normalized_name, sort_order, created_at, updated_at) 
        VALUES (
          @id, @name, @normalizedName, @sortOrder, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: attribute.UpdateCategory): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE categories SET name = @name, normalized_name = @normalizedName, 
        sort_order = @sortOrder, updated_at = @updatedAt WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString() });
  }
}
