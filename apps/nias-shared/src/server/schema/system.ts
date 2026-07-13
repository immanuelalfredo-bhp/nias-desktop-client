import { boolean, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schemas from '../../common/defines.js';

export const systemSchema = pgSchema('system');

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const users = systemSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  isManagedBy: uuid('is_managed_by'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const UserSchema = createSelectSchema(users, {
  displayName: schemas.displayName,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export type User = typeof users.$inferSelect;