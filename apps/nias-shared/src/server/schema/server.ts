import { pgSchema, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';
import {
  users,
  audit,
} from './system.js';
import {
  brands,
  modes,
  uoms,
  dimensions,
  dimensionValues,
  systems,
  categories,
  vendors,
  tags,
} from './attribute.js';
import {
  itemRecords,
  aliases,
  dimensionMap,
  systemMap,
  tagMap,
  generationRules,
} from './item.js';
import {
  variantRecords,
  dimensionValueMap,
} from './variant.js';
import { requestItems } from './order.js';

export const authSchema = pgSchema('auth');
export const syncSchema = pgSchema('sync');

export const serverUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
});

export const syncMetadata = syncSchema.table('metadata', {
  tableName: text('table_name').primaryKey(),
  syncVersion: integer('sync_version').notNull().default(0),
});

export const syncChanges = syncSchema.table('changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tableName: text('table_name').notNull(),
  payload: text('payload').notNull(), // JSON string representing the pushed changes
  processedAt: timestamp('processed_at', { mode: 'string' }).defaultNow().notNull(),
});

export const SYNC_TABLE_MAP = [
  { key: 'users', tableName: 'users', table: users },
  { key: 'audit', tableName: 'audit', table: audit },
  { key: 'brands', tableName: 'brands', table: brands },
  { key: 'modes', tableName: 'modes', table: modes },
  { key: 'uoms', tableName: 'uoms', table: uoms },
  { key: 'dimensions', tableName: 'dimensions', table: dimensions },
  { key: 'dimensionValues', tableName: 'dimension_values', table: dimensionValues },
  { key: 'systems', tableName: 'systems', table: systems },
  { key: 'categories', tableName: 'categories', table: categories },
  { key: 'vendors', tableName: 'vendors', table: vendors },
  { key: 'tags', tableName: 'tags', table: tags },
  { key: 'itemRecords', tableName: 'item_records', table: itemRecords },
  { key: 'aliases', tableName: 'aliases', table: aliases },
  { key: 'dimensionMap', tableName: 'dimension_map', table: dimensionMap },
  { key: 'systemMap', tableName: 'system_map', table: systemMap },
  { key: 'tagMap', tableName: 'tag_map', table: tagMap },
  { key: 'generationRules', tableName: 'generation_rules', table: generationRules },
  { key: 'variantRecords', tableName: 'variant_records', table: variantRecords },
  { key: 'dimensionValueMap', tableName: 'dimension_value_map', table: dimensionValueMap },
] as const;

export const SyncChangeSchema = createSelectSchema(syncChanges, {
  processedAt: schemas.dateTime,
});

export type ServerUser = typeof serverUsers.$inferSelect;
export type SyncChange = typeof syncChanges.$inferSelect;
export type SyncTableKey = (typeof SYNC_TABLE_MAP)[number]['key'];
export type SyncTableName = (typeof SYNC_TABLE_MAP)[number]['tableName'];
export type SyncMetadata = Record<string, number>;
