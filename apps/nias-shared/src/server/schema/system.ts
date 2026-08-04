import { boolean, jsonb, integer, pgSchema, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const systemSchema = pgSchema('system');

const systemBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const systemOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const users = systemSchema.table('users', {
  ...systemBaseFields,
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  isManagedBy: uuid('is_managed_by'),
});

export const audit = systemSchema.table('audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  timestamp: timestamp('timestamp', { mode: 'string' }).defaultNow().notNull(),
  details: jsonb('details').notNull(),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const UserSchema = createSelectSchema(users, {
  ...systemOverrides,
  displayName: schemas.displayName,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
});

export const AuditSchema = createSelectSchema(audit, {
  action: schemas.string,
  tableName: schemas.string,
  recordId: schemas.string,
  timestamp: schemas.dateTime,
  details: schemas.jsonb,
});

export type User = typeof users.$inferSelect;
export type Audit = typeof audit.$inferSelect;
