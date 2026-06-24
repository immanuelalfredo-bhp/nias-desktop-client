import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the users table schema
export const user = pgTable('user', {
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
  syncVersion: integer('sync_version'),
});

// Infer the TypeScript types for the users table
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          AUDIT SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the audit table schema
export const audit = pgTable('audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  eventType: text('event_type').notNull(),
  performedBy: uuid('performed_by').notNull(),
  description: text('description').notNull(),
  timestamp: timestamp('timestamp', { mode: 'string' }).defaultNow().notNull(),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version'),
});

// Infer the TypeScript types for the audit table
export type Audit = typeof audit.$inferSelect;
export type NewAudit = typeof audit.$inferInsert;