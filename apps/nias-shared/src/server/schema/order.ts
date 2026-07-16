import { boolean, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const orderSchema = pgSchema('order');

const orderBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const orderOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const requests = orderSchema.table('requests', {
  ...orderBaseFields,
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  comments: text('comments'),
});

export const requestItems = orderSchema.table('request_items', {
  ...orderBaseFields,
  requestId: uuid('request_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  total: integer('total').notNull(),
  comments: text('comments'),
});

// Only include fields with specific validation rules.
export const RequestSchema = createSelectSchema(requests, {
  ...orderOverrides,
  comments: schemas.blob.nullable(),
});

export const RequestItemSchema = createSelectSchema(requestItems, {
  ...orderOverrides,
  comments: schemas.blob.nullable(),
});

export type Request = typeof requests.$inferSelect;
export type RequestItem = typeof requestItems.$inferSelect;
