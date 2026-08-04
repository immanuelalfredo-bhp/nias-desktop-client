import { boolean, jsonb, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const itemSchema = pgSchema('item');

const itemBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const itemOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const itemRecords = itemSchema.table('records', {
  ...itemBaseFields,
  baseName: text('base_name').notNull(),
  normalizedBaseName: text('normalized_base_name').notNull(),
  displayName: text('display_name').notNull(),
  normalizedDisplayName: text('normalized_display_name').notNull(),
  skuSource: text('sku_source').notNull(),
  skuCode: text('sku_code').notNull(),
  materialType: text('material_type').notNull(),
  materialClass: text('material_class').notNull(),
  creationSource: text('creation_source').notNull(),
  delimiterType: text('delimiter_type').notNull(),
  hasAutoAssemblyTrigger: boolean('has_auto_assembly_trigger').notNull(),
  imageUrl: text('image_url'),
});

export const aliases = itemSchema.table('aliases', {
  ...itemBaseFields,
  itemId: uuid('item_id').notNull(),
  alias: text('alias').notNull(),
  normalizedAlias: text('normalized_alias').notNull(),
});

export const dimensionMap = itemSchema.table('dimension_map', {
  ...itemBaseFields,
  itemId: uuid('item_id').notNull(),
  dimensionId: uuid('dimension_id').notNull(),
});

export const systemMap = itemSchema.table('system_map', {
  ...itemBaseFields,
  itemId: uuid('item_id').notNull(),
  systemId: uuid('system_id').notNull(),
});

export const tagMap = itemSchema.table('tag_map', {
  ...itemBaseFields,
  itemId: uuid('item_id').notNull(),
  tagId: uuid('tag_id').notNull(),
});

export const generationRules = itemSchema.table('generation_rules', {
  ...itemBaseFields,
  itemId: uuid('item_id').notNull(),
  categoryId: uuid('category_id').notNull(),
  brandId: uuid('brand_id').notNull(),
  modeId: uuid('mode_id').notNull(),
  uomId: uuid('uom_id').notNull(),
  rules: jsonb('rules').notNull(),
  isDirty: boolean('is_dirty').default(true).notNull(),
});

// Only include fields with specific validation rules.
export const ItemRecordSchema = createSelectSchema(itemRecords, {
  ...itemOverrides,
  baseName: schemas.string,
  normalizedBaseName: schemas.slug,
  displayName: schemas.string,
  normalizedDisplayName: schemas.slug,
  skuSource: schemas.skuSource,
  skuCode: schemas.skuGeneric,
  materialType: schemas.materialType,
  materialClass: schemas.materialClass,
  creationSource: schemas.creationSource,
  delimiterType: schemas.delimiterType,
  imageUrl: schemas.string.nullable(),
});

export const AliasSchema = createSelectSchema(aliases, {
  ...itemOverrides,
  alias: schemas.string,
  normalizedAlias: schemas.slug,
});

export const DimensionMapSchema = createSelectSchema(dimensionMap, {
  ...itemOverrides,
});

export const SystemMapSchema = createSelectSchema(systemMap, {
  ...itemOverrides,
});

export const TagMapSchema = createSelectSchema(tagMap, {
  ...itemOverrides,
});


export const GenerationRulesSchema = createSelectSchema(generationRules, {
  ...itemOverrides,
});

export type ItemRecord = typeof itemRecords.$inferSelect;
export type Alias = typeof aliases.$inferSelect;
export type DimensionMap = typeof dimensionMap.$inferSelect;
export type SystemMap = typeof systemMap.$inferSelect;
export type TagMap = typeof tagMap.$inferSelect;
export type GenerationRules = typeof generationRules.$inferSelect;
