import { boolean, integer, pgSchema, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const orderSchema = pgSchema('order');

const orderBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' })
};

const orderOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const requestItems = orderSchema.table('provisional_request', {
  ...orderBaseFields,
  variantId: uuid('variant_id').notNull(),
  quantity: integer('quantity').notNull(),
  total: real('total').notNull(),
  comments: text('comments'),
});

// Only include fields with specific validation rules.
export const RequestItemSchema = createSelectSchema(requestItems, {
  ...orderOverrides,
  comments: schemas.blob.nullable(),
});

export type RequestItem = typeof requestItems.$inferSelect;
