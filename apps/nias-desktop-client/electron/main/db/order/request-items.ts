import Database from 'better-sqlite3-multiple-ciphers';
import { order } from '@nias/shared';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  request_id as requestId,
  variant_id as variantId,
  quantity,
  price,
  total,
  comments,
  created_at as createdAt,
  updated_at as updatedAt,
  deleted_at as deletedAt,
  is_synced as isSynced,
  sync_version as syncVersion`;

export class RequestItemQueries extends BaseQueries<
  order.RequestItem,
  order.CreateRequestItem,
  order.UpdateRequestItem
> {
  constructor(db: Database.Database) {
    super(db, 'request_items', COLUMNS);
  }
  create(params: order.CreateRequestItem): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO request_items (
          id, request_id, variant_id, quantity, price, total, comments, created_at, updated_at) 
        VALUES (
          @id, @requestId, @variantId, @quantity, @price, @total, @comments, @createdAt, @updatedAt)`,
      )
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: order.UpdateRequestItem): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(
        `
        UPDATE request_items SET 
          request_id = @requestId, variant_id = @variantId, quantity = @quantity, price = @price,
          total = @total, comments = @comments, updated_at = @updatedAt, is_synced = @isSynced
          WHERE id = @id`,
      )
      .run({ ...existing, ...params, updatedAt: new Date().toISOString(), isSynced: 0 });
  }
  upsert(params: order.RequestItem): void {
    this.db
      .prepare(
        `
        INSERT INTO request_items (
          id, request_id, variant_id, quantity, price, total, comments, created_at, updated_at,
          deleted_at, is_synced, sync_version) 
        VALUES (
          @id, @requestId, @variantId, @quantity, @price, @total, @comments, @createdAt, @updatedAt,
          @deletedAt, @isSynced, @syncVersion)
        ON CONFLICT(id) DO UPDATE SET
          request_id = excluded.request_id,
          variant_id = excluded.variant_id,
          quantity = excluded.quantity,
          price = excluded.price,
          total = excluded.total,
          comments = excluded.comments,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          is_synced = excluded.is_synced,
          sync_version = excluded.sync_version`,
      )
      .run(params);
  }
}
