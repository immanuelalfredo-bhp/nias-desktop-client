import { boolean, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const systemSchema = pgSchema('system');

export const users = systemSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  isManagedBy: uuid('is_managed_by'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export type User = typeof users.$inferSelect;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          AUDIT SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const audit = systemSchema.table('audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  eventType: text('event_type').notNull(),
  performedBy: uuid('performed_by').notNull(),
  description: text('description').notNull(),
  timestamp: timestamp('timestamp', { mode: 'string' }).defaultNow().notNull(),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export type Audit = typeof audit.$inferSelect;
