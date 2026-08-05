import Database from 'better-sqlite3-multiple-ciphers';
import { order } from '@nias/shared';
import { BaseQueries } from '../helper.js';

const COLUMNS = `
  id,
  variant_id AS variantId,
  quantity,
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
            comments,
            created_at,
            updated_at
          )
        VALUES
          (
            @id,
            @variantId,
            @quantity,
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
            @comments,
            @createdAt,
            @updatedAt,
            @deletedAt
          )
        ON CONFLICT (id) DO UPDATE
        SET
          variant_id = excluded.variant_id,
          quantity = excluded.quantity,
          comments = excluded.comments,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at
      `)
      .run({ ...params});
  }
  listWithInfo(): any[] {
    return this.db
      .prepare(`
        SELECT
          pr.id,
          pr.variant_id AS variantId,
          pr.quantity,
          pr.comments,
          pr.created_at AS createdAt,
          pr.updated_at AS updatedAt,
          pr.deleted_at AS deletedAt,
          v.sku_code AS skuCode,
          v.description AS variantName,
          u.symbol AS uomSymbol
        FROM
          provisional_request pr
        LEFT JOIN
          variant_records v ON pr.variant_id = v.id
        LEFT JOIN
          uoms u ON v.uom_id = u.id
        WHERE
          pr.deleted_at IS NULL
        ORDER BY
          pr.created_at ASC
      `)
      .all();
  }
  hardDelete(id: string): void {
    this.db
      .prepare(`
        DELETE FROM provisional_request
        WHERE id = @id
      `)
      .run({ id });
  }
  editQuantity(id: string, newQuantity: number): void {
    this.db
      .prepare(`
        UPDATE provisional_request
        SET quantity = @newQuantity,
            updated_at = @updatedAt
        WHERE id = @id
      `)
      .run({ id, newQuantity, updatedAt: new Date().toISOString() });
  }
}
