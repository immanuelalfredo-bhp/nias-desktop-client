import { z } from 'zod';
import { EntityIdSchema } from './common.js';
import {
  BrandSchema as DrizzleBrandSchema,
  ModeSchema as DrizzleModesSchema,
  UomSchema as DrizzleUomsSchema,
  DimensionSchema as DrizzleDimensionsSchema,
  DimensionValueSchema as DrizzleDimensionValuesSchema,
  SystemSchema as DrizzleSystemsSchema,
  CategorySchema as DrizzleCategoriesSchema,
  VendorSchema as DrizzleVendorsSchema,
  TagSchema as DrizzleTagsSchema,
  type Brand as DrizzleBrand,
  type Mode as DrizzleMode,
  type Uom as DrizzleUom,
  type Dimension as DrizzleDimension,
  type DimensionValue as DrizzleDimensionValue,
  type System as DrizzleSystem,
  type Category as DrizzleCategory,
  type Vendor as DrizzleVendor,
  type Tag as DrizzleTag,
} from '../server/schema/attribute.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         BRAND SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const BrandSchema = DrizzleBrandSchema;
export type Brand = DrizzleBrand;

export const CreateBrandSchema = BrandSchema.omit({
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export const CreateBrandInputSchema = BrandSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBrandSchema = CreateBrandSchema.partial();
export const UpdateBrandInputSchema = CreateBrandInputSchema.partial();
export const BrandIdSchema = EntityIdSchema;

export type CreateBrand = z.infer<typeof CreateBrandSchema>;
export type UpdateBrand = z.infer<typeof UpdateBrandSchema>;
export type CreateBrandInput = z.infer<typeof CreateBrandInputSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandInputSchema>;
export type BrandId = z.infer<typeof BrandIdSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         MODE SCHEMAS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ModeSchema = DrizzleModesSchema;
export type Mode = DrizzleMode;

export const CreateModeSchema = ModeSchema.omit({
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export const CreateModeInputSchema = ModeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateModeSchema = CreateModeSchema.partial();
export const UpdateModeInputSchema = CreateModeInputSchema.partial();
export const ModeIdSchema = EntityIdSchema;

export type CreateMode = z.infer<typeof CreateModeSchema>;
export type UpdateMode = z.infer<typeof UpdateModeSchema>;
export type CreateModeInput = z.infer<typeof CreateModeInputSchema>;
export type UpdateModeInput = z.infer<typeof UpdateModeInputSchema>;
export type ModeId = z.infer<typeof ModeIdSchema>;
