import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          SYNC SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the sync table schema
export const sync = pgTable('sync', {
  user: integer('user').notNull().default(0),
  auditLog: integer('audit_log').notNull().default(0),
});

// Infer the TypeScript type for the sync table
export type SyncVersion = typeof sync.$inferSelect;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    PROPOSED CHANGES SCHEMAS                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the proposed_changes table schema
export const proposedChanges = pgTable('proposed_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: text('table_name').notNull(),
  payload: text('payload').notNull(), // JSON string representing the proposed changes
  status: text('status').notNull(), // 'pending', 'processed', or 'rejected'
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { mode: 'string' }).defaultNow().notNull(),
});

// Infer the TypeScript type for the proposed_changes table
export type ProposedChanges = typeof proposedChanges.$inferSelect;
