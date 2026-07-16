import { pgSchema, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const authSchema = pgSchema('auth');
export const syncSchema = pgSchema('sync');

export const serverUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  accessToken: text('access_token').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
});

export const syncMetadata = syncSchema.table('metadata', {
  // System tables
  users: integer('users').notNull().default(0),
  roles: integer('roles').notNull().default(0),
  projects: integer('projects').notNull().default(0),
  roleCapabilities: integer('role_capabilities').notNull().default(0),
  roleManagement: integer('role_management').notNull().default(0),
  roleMap: integer('role_map').notNull().default(0),
  projectMap: integer('project_map').notNull().default(0),
  audit: integer('audit').notNull().default(0),

  // Attribute tables
  brands: integer('brands').notNull().default(0),
  modes: integer('modes').notNull().default(0),
  uoms: integer('uoms').notNull().default(0),
  dimensions: integer('dimensions').notNull().default(0),
  dimensionValues: integer('dimension_values').notNull().default(0),
  systems: integer('systems').notNull().default(0),
  categories: integer('categories').notNull().default(0),
  vendors: integer('vendors').notNull().default(0),
  tags: integer('tags').notNull().default(0),

  // Item tables
  itemRecords: integer('item_records').notNull().default(0),
  aliases: integer('aliases').notNull().default(0),
  brandlineMap: integer('brandline_map').notNull().default(0),
  vendorMap: integer('vendor_map').notNull().default(0),
  dimensionMap: integer('dimension_map').notNull().default(0),
  systemMap: integer('system_map').notNull().default(0),
  tagMap: integer('tag_map').notNull().default(0),
  generationRules: integer('generation_rules').notNull().default(0),

  // Variant tables
  variantRecords: integer('variant_records').notNull().default(0),
  dimensionValueMap: integer('dimension_value_map').notNull().default(0),
  componentMap: integer('component_map').notNull().default(0),
  switchMap: integer('switch_map').notNull().default(0),
  vendorPrice: integer('vendor_price').notNull().default(0),

  // Order tables
  requests: integer('requests').notNull().default(0),
  requestItems: integer('request_items').notNull().default(0),
});

export const syncChanges = syncSchema.table('changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tableName: text('table_name').notNull(),
  payload: text('payload').notNull(), // JSON string representing the pushed changes
  processedAt: timestamp('processed_at', { mode: 'string' }).defaultNow().notNull(),
});

// Only include fields with specific validation rules.
export const ServerUserSchema = createSelectSchema(serverUsers, {
  accessToken: schemas.string,
  expiresAt: schemas.dateTime,
});
export const SyncMetadataSchema = createSelectSchema(syncMetadata);
export const SyncChangeSchema = createSelectSchema(syncChanges, {
  processedAt: schemas.dateTime,
});

export type ServerUser = typeof serverUsers.$inferSelect;
export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type SyncChange = typeof syncChanges.$inferSelect;
