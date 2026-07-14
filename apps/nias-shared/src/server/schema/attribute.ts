import { boolean, real, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const attributeSchema = pgSchema('attribute');

const attributeBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sortOrder: real('sort_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const attributeOverrides = {
  name: schemas.string,
  sortOrder: schemas.sortOrder,
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         BRAND SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const brands = attributeSchema.table('brands', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
  skuCode: text('sku_code').notNull(),
});

export const modes = attributeSchema.table('modes', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
});

export const uoms = attributeSchema.table('uoms', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
  symbol: text('symbol').notNull(),
});

export const dimensions = attributeSchema.table('dimensions', {
  ...attributeBaseFields,
  scope: text('scope').notNull(),
  normalizedName: text('normalized_name').notNull(),
  formName: text('form_name').notNull(),
  position: text('position').notNull(),
});

export const dimensionValues = attributeSchema.table('dimension_values', {
  ...attributeBaseFields,
  dimensionId: uuid('dimension_id').notNull(),
  skuCode: text('sku_code').notNull(),
  numericValue: real('numeric_value'),
});

export const systems = attributeSchema.table('systems', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
});

export const categories = attributeSchema.table('categories', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
});

export const vendors = attributeSchema.table('vendors', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
  skuCode: text('sku_code').notNull(),
});

export const tags = attributeSchema.table('tags', {
  ...attributeBaseFields,
  normalizedName: text('normalized_name').notNull(),
});

// Only include fields with specific validation rules.
export const BrandSchema = createSelectSchema(brands, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
  skuCode: schemas.skuBrand,
});

export const ModeSchema = createSelectSchema(modes, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
});

export const UomSchema = createSelectSchema(uoms, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
  symbol: schemas.string,
});

export const DimensionSchema = createSelectSchema(dimensions, {
  ...attributeOverrides,
  scope: schemas.string,
  normalizedName: schemas.slug,
  formName: schemas.string,
  position: schemas.string,
});

export const DimensionValueSchema = createSelectSchema(dimensionValues, {
  ...attributeOverrides,
  dimensionId: schemas.uuid,
  numericValue: schemas.float.nullable(),
});

export const SystemSchema = createSelectSchema(systems, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
});

export const CategorySchema = createSelectSchema(categories, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
});

export const VendorSchema = createSelectSchema(vendors, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
  skuCode: schemas.skuVendor,
});

export const TagSchema = createSelectSchema(tags, {
  ...attributeOverrides,
  normalizedName: schemas.slug,
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
