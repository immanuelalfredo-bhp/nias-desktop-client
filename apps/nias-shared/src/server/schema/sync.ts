import { integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

const syncSchema = pgSchema('sync');

export const syncMetadata = syncSchema.table('metadata', {
  users: integer('users').notNull().default(0),
  audit: integer('audit').notNull().default(0),
});

export const changelog = syncSchema.table('changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tableName: text('table_name').notNull(),
  payload: text('payload').notNull(), // JSON string representing the pushed changes
  processedAt: timestamp('processed_at', { mode: 'string' }).defaultNow().notNull(),
});

export const SyncMetadataSchema = createSelectSchema(syncMetadata);
export const ChangelogSchema = createSelectSchema(changelog);
export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type Changelog = typeof changelog.$inferSelect;
