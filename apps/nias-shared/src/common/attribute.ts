import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
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

export const BrandIdSchema = EntityIdSchema;
export const BrandSchema = DrizzleBrandSchema;
export type Brand = DrizzleBrand;

export const CreateBrandSchema = BrandSchema.omit(CreateOmissions);
export const UpdateBrandSchema = BrandSchema.pick({
  id: true,
}).extend(BrandSchema.omit(UpdateOmissions).partial().shape);
export const CreateBrandInputSchema = CreateBrandSchema.omit({ id: true, normalizedName: true });
export const UpdateBrandInputSchema = UpdateBrandSchema.omit({ normalizedName: true });

export type BrandId = z.infer<typeof BrandIdSchema>;
export type CreateBrand = z.infer<typeof CreateBrandSchema>;
export type UpdateBrand = z.infer<typeof UpdateBrandSchema>;
export type CreateBrandInput = z.infer<typeof CreateBrandInputSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         MODE SCHEMAS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ModeIdSchema = EntityIdSchema;
export const ModeSchema = DrizzleModesSchema;
export type Mode = DrizzleMode;

export const CreateModeSchema = ModeSchema.omit(CreateOmissions);
export const UpdateModeSchema = ModeSchema.pick({
  id: true,
}).extend(ModeSchema.omit(UpdateOmissions).partial().shape);
export const CreateModeInputSchema = CreateModeSchema.omit({ id: true, normalizedName: true });
export const UpdateModeInputSchema = UpdateModeSchema.omit({ normalizedName: true });

export type ModeId = z.infer<typeof ModeIdSchema>;
export type CreateMode = z.infer<typeof CreateModeSchema>;
export type UpdateMode = z.infer<typeof UpdateModeSchema>;
export type CreateModeInput = z.infer<typeof CreateModeInputSchema>;
export type UpdateModeInput = z.infer<typeof UpdateModeInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          UOM SCHEMAS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const UomIdSchema = EntityIdSchema;
export const UomSchema = DrizzleUomsSchema;
export type Uom = DrizzleUom;

export const CreateUomSchema = UomSchema.omit(CreateOmissions);
export const UpdateUomSchema = UomSchema.pick({
  id: true,
}).extend(UomSchema.omit(UpdateOmissions).partial().shape);
export const CreateUomInputSchema = CreateUomSchema.omit({ id: true, normalizedName: true });
export const UpdateUomInputSchema = UpdateUomSchema.omit({ normalizedName: true });

export type UomId = z.infer<typeof UomIdSchema>;
export type CreateUom = z.infer<typeof CreateUomSchema>;
export type UpdateUom = z.infer<typeof UpdateUomSchema>;
export type CreateUomInput = z.infer<typeof CreateUomInputSchema>;
export type UpdateUomInput = z.infer<typeof UpdateUomInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                       DIMENSION SCHEMAS                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const DimensionIdSchema = EntityIdSchema;
export const DimensionSchema = DrizzleDimensionsSchema;
export type Dimension = DrizzleDimension;

export const CreateDimensionSchema = DimensionSchema.omit(CreateOmissions);
export const UpdateDimensionSchema = DimensionSchema.pick({
  id: true,
}).extend(DimensionSchema.omit(UpdateOmissions).partial().shape);
export const CreateDimensionInputSchema = CreateDimensionSchema.omit({
  id: true,
  normalizedName: true,
});
export const UpdateDimensionInputSchema = UpdateDimensionSchema.omit({ normalizedName: true });

export type DimensionId = z.infer<typeof DimensionIdSchema>;
export type CreateDimension = z.infer<typeof CreateDimensionSchema>;
export type UpdateDimension = z.infer<typeof UpdateDimensionSchema>;
export type CreateDimensionInput = z.infer<typeof CreateDimensionInputSchema>;
export type UpdateDimensionInput = z.infer<typeof UpdateDimensionInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    DIMENSION VALUE SCHEMAS                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const DimensionValueIdSchema = EntityIdSchema;
export const DimensionValueSchema = DrizzleDimensionValuesSchema;
export type DimensionValue = DrizzleDimensionValue;

export const CreateDimensionValueSchema = DimensionValueSchema.omit(CreateOmissions);
export const UpdateDimensionValueSchema = DimensionValueSchema.pick({
  id: true,
}).extend(DimensionValueSchema.omit(UpdateOmissions).partial().shape);
export const CreateDimensionValueInputSchema = CreateDimensionValueSchema.omit({ id: true });

export type DimensionValueId = z.infer<typeof DimensionValueIdSchema>;
export type CreateDimensionValue = z.infer<typeof CreateDimensionValueSchema>;
export type UpdateDimensionValue = z.infer<typeof UpdateDimensionValueSchema>;
export type CreateDimensionValueInput = z.infer<typeof CreateDimensionValueInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         SYSTEM SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const SystemIdSchema = EntityIdSchema;
export const SystemSchema = DrizzleSystemsSchema;
export type System = DrizzleSystem;

export const CreateSystemSchema = SystemSchema.omit(CreateOmissions);
export const UpdateSystemSchema = SystemSchema.pick({
  id: true,
}).extend(SystemSchema.omit(UpdateOmissions).partial().shape);
export const CreateSystemInputSchema = CreateSystemSchema.omit({ id: true, normalizedName: true });
export const UpdateSystemInputSchema = UpdateSystemSchema.omit({ normalizedName: true });

export type SystemId = z.infer<typeof SystemIdSchema>;
export type CreateSystem = z.infer<typeof CreateSystemSchema>;
export type UpdateSystem = z.infer<typeof UpdateSystemSchema>;
export type CreateSystemInput = z.infer<typeof CreateSystemInputSchema>;
export type UpdateSystemInput = z.infer<typeof UpdateSystemInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        CATEGORY SCHEMAS                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const CategoryIdSchema = EntityIdSchema;
export const CategorySchema = DrizzleCategoriesSchema;
export type Category = DrizzleCategory;

export const CreateCategorySchema = CategorySchema.omit(CreateOmissions);
export const UpdateCategorySchema = CategorySchema.pick({
  id: true,
}).extend(CategorySchema.omit(UpdateOmissions).partial().shape);
export const CreateCategoryInputSchema = CreateCategorySchema.omit({
  id: true,
  normalizedName: true,
});
export const UpdateCategoryInputSchema = UpdateCategorySchema.omit({ normalizedName: true });

export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         VENDOR SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const VendorIdSchema = EntityIdSchema;
export const VendorSchema = DrizzleVendorsSchema;
export type Vendor = DrizzleVendor;

export const CreateVendorSchema = VendorSchema.omit(CreateOmissions);
export const UpdateVendorSchema = VendorSchema.pick({
  id: true,
}).extend(VendorSchema.omit(UpdateOmissions).partial().shape);
export const CreateVendorInputSchema = CreateVendorSchema.omit({ id: true, normalizedName: true });
export const UpdateVendorInputSchema = UpdateVendorSchema.omit({ normalizedName: true });

export type VendorId = z.infer<typeof VendorIdSchema>;
export type CreateVendor = z.infer<typeof CreateVendorSchema>;
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;
export type CreateVendorInput = z.infer<typeof CreateVendorInputSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          TAG SCHEMAS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const TagIdSchema = EntityIdSchema;
export const TagSchema = DrizzleTagsSchema;
export type Tag = DrizzleTag;

export const CreateTagSchema = TagSchema.omit(CreateOmissions);
export const UpdateTagSchema = TagSchema.pick({
  id: true,
}).extend(TagSchema.omit(UpdateOmissions).partial().shape);
export const CreateTagInputSchema = CreateTagSchema.omit({ id: true, normalizedName: true });
export const UpdateTagInputSchema = UpdateTagSchema.omit({ normalizedName: true });

export type TagId = z.infer<typeof TagIdSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
export type UpdateTag = z.infer<typeof UpdateTagSchema>;
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
