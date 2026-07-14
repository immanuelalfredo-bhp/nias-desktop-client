import { boolean, real, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const attributeSchema = pgSchema('attribute');

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         BRAND SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const brands = attributeSchema.table('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  skuCode: text('sku_code').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const modes = attributeSchema.table('modes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const uoms = attributeSchema.table('uoms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  symbol: text('symbol').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const dimensions = attributeSchema.table('dimensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scope: text('scope').notNull(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  formName: text('form_name').notNull(),
  position: text('position').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const dimensionValues = attributeSchema.table('dimension_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  dimensionId: uuid('dimension_id').notNull(),
  name: text('name').notNull(),
  skuCode: text('sku_code').notNull(),
  numericValue: real('numeric_value'),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const systems = attributeSchema.table('systems', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const categories = attributeSchema.table('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const vendors = attributeSchema.table('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  skuCode: text('sku_code').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const tags = attributeSchema.table('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

// Only include fields with specific validation rules.
export const BrandSchema = createSelectSchema(brands, {
  name: schemas.string,
  normalizedName: schemas.slug,
  skuCode: schemas.skuBrand,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const ModeSchema = createSelectSchema(modes, {
  name: schemas.string,
  normalizedName: schemas.slug,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const UomSchema = createSelectSchema(uoms, {
  name: schemas.string,
  normalizedName: schemas.slug,
  symbol: schemas.string,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const DimensionSchema = createSelectSchema(dimensions, {
  scope: schemas.scope,
  name: schemas.string,
  normalizedName: schemas.slug,
  formName: schemas.string,
  position: schemas.position,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const DimensionValueSchema = createSelectSchema(dimensionValues, {
  name: schemas.string,
  skuCode: schemas.skuBrand,
  numericValue: schemas.float,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const SystemSchema = createSelectSchema(systems, {
  name: schemas.string,
  normalizedName: schemas.slug,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const CategorySchema = createSelectSchema(categories, {
  name: schemas.string,
  normalizedName: schemas.slug,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const VendorSchema = createSelectSchema(vendors, {
  name: schemas.string,
  normalizedName: schemas.slug,
  skuCode: schemas.skuVendor,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export const TagSchema = createSelectSchema(tags, {
  name: schemas.string,
  normalizedName: schemas.slug,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
});

export type Brand = typeof brands.$inferSelect;
export type Mode = typeof modes.$inferSelect;
export type Uom = typeof uoms.$inferSelect;
export type Dimension = typeof dimensions.$inferSelect;
export type DimensionValue = typeof dimensionValues.$inferSelect;
export type System = typeof systems.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Tag = typeof tags.$inferSelect;
