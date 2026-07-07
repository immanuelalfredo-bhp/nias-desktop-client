import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Define the auth schema
export const authSchema = pgSchema('auth');

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          AUTH SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the auth table schema
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  accessToken: text('access_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Infer the TypeScript type for the auth table
export type AuthUser = typeof authUsers.$inferSelect;