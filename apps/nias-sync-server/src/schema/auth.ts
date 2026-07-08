import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  accessToken: text('access_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export type AuthUser = typeof authUsers.$inferSelect;
