import {
  boolean,
  jsonb,
  real,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const variantSchema = pgSchema('variant');

const variantBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const variantOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const variantRecords = variantSchema.table('records', {
  ...variantBaseFields,
  itemId: uuid('item_id').notNull(),
  categoryId: uuid('category_id').notNull(),
  brandId: uuid('brand_id').notNull(),
  modeId: uuid('mode_id').notNull(),
  uomId: uuid('uom_id').notNull(),
  dimensionValueIds: uuid('dimension_value_ids').array().notNull(),
  description: text('description').notNull(),
  skuCode: text('sku_code').notNull(),
  details: jsonb('details').notNull(),
});

export const dimensionValueMap = variantSchema.table('dimension_value_map', {
  ...variantBaseFields,
  variantId: uuid('variant_id').notNull(),
  dimensionValueId: uuid('dimension_value_id').notNull(),
});

export const componentMap = variantSchema.table('component_map', {
  ...variantBaseFields,
  variantId: uuid('variant_id').notNull(),
  componentId: uuid('component_id').notNull(),
  quantity: integer('quantity').notNull(),
});

export const switchMap = variantSchema.table('switch_map', {
  ...variantBaseFields,
  variantId: uuid('variant_id').notNull(),
  assemblyId: uuid('assembly_id').notNull(),
});

export const vendorPrice = variantSchema.table('vendor_price', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull(),
  vendorId: uuid('vendor_id').notNull(),
  originalPrice: real('original_price').notNull(),
  discountedPrice: real('discounted_price').notNull(),
  discountRate: real('discount_rate').notNull(),
  effectiveDate: timestamp('effective_date', { mode: 'string' }).notNull(),
  expirationDate: timestamp('expiration_date', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

// Only include fields with specific validation rules.
export const VariantRecordSchema = createSelectSchema(variantRecords, {
  ...variantOverrides,
  description: schemas.string,
  skuCode: schemas.string,
  details: schemas.jsonb,
});

export const DimensionValueMapSchema = createSelectSchema(dimensionValueMap, {
  ...variantOverrides,
});

export const ComponentMapSchema = createSelectSchema(componentMap, {
  ...variantOverrides,
});

export const SwitchMapSchema = createSelectSchema(switchMap, {
  ...variantOverrides,
});

export const VendorPriceSchema = createSelectSchema(vendorPrice, {
  originalPrice: schemas.float,
  discountedPrice: schemas.float,
  discountRate: schemas.float,
  effectiveDate: schemas.dateTime,
  expirationDate: schemas.dateTime.nullable(),
});

export type VariantRecord = typeof variantRecords.$inferSelect;
export type DimensionValueMap = typeof dimensionValueMap.$inferSelect;
export type ComponentMap = typeof componentMap.$inferSelect;
export type SwitchMap = typeof switchMap.$inferSelect;
export type VendorPrice = typeof vendorPrice.$inferSelect;
