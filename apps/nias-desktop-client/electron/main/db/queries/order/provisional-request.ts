import Database from 'better-sqlite3-multiple-ciphers';
import { order } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  variant_id AS variantId,
  quantity,
  total,
  comments,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt
`;

const SORT_ORDER = ` created_at ASC `;

export class RequestItemQueries extends BaseQueries<
  order.RequestItem,
  order.CreateRequestItem,
  order.UpdateRequestItem
> {
  constructor(db: Database.Database) {
    super(db, 'provisional_request', COLUMNS, SORT_ORDER);
  }
  create(params: order.CreateRequestItem): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO
          provisional_request (
            id,
            variant_id,
            quantity,
            total,
            comments,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @variantId,
            @quantity,
            @total,
            @comments,
            @createdAt,
            @updatedAt
          )
      `)
      .run({ ...params, createdAt: now, updatedAt: now });
  }
  update(params: order.UpdateRequestItem): void {
    const existing = this.getById(params.id);
    if (!existing) throw new Error('Not found');

    this.db
      .prepare(`
        UPDATE provisional_request
        SET
          variant_id = @variantId,
          quantity = @quantity,
          total = @total,
          comments = @comments,
          updated_at = @updatedAt
        WHERE
          id = @id
      `)
      .run({ ...existing, ...params, updatedAt: new Date().toISOString() });
  }
  upsert(params: order.RequestItem): void {
    this.db
      .prepare(`
        INSERT INTO
          provisional_request (
            id,
            variant_id,
            quantity,
            total,
            comments,
            created_at,
            updated_at,
            deleted_at
          )
        VALUES
          (
            @id,
            @variantId,
            @quantity,
            @total,
            @comments,
            @createdAt,
            @updatedAt,
            @deletedAt
          )
        ON CONFLICT (id) DO UPDATE
        SET
          variant_id = excluded.variant_id,
          quantity = excluded.quantity,
          total = excluded.total,
          comments = excluded.comments,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at
      `)
      .run({ ...params});
  }
}
