import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import {
  VariantRecordSchema as DrizzleVariantRecordSchema,
  DimensionValueMapSchema as DrizzleDimensionValueMapSchema,
  ComponentMapSchema as DrizzleComponentMapSchema,
  SwitchMapSchema as DrizzleSwitchMapSchema,
  VendorPriceSchema as DrizzleVendorPriceSchema,
  type VariantRecord as DrizzleVariantRecord,
  type DimensionValueMap as DrizzleDimensionValueMap,
  type ComponentMap as DrizzleComponentMap,
  type SwitchMap as DrizzleSwitchMap,
  type VendorPrice as DrizzleVendorPrice,
} from '../server/schema/variant.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                     VARIANT RECORD SCHEMAS                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const VariantRecordIdSchema = EntityIdSchema;
export const VariantRecordSchema = DrizzleVariantRecordSchema;
export type VariantRecord = DrizzleVariantRecord;

export const CreateVariantRecordSchema = VariantRecordSchema.omit(CreateOmissions);
export const UpdateVariantRecordSchema = VariantRecordSchema.pick({
  id: true,
}).extend(VariantRecordSchema.omit(UpdateOmissions).partial().shape);
export const CreateVariantRecordInputSchema = CreateVariantRecordSchema.omit({
  id: true,
});

export type VariantRecordId = z.infer<typeof VariantRecordIdSchema>;
export type CreateVariantRecord = z.infer<typeof CreateVariantRecordSchema>;
export type UpdateVariantRecord = z.infer<typeof UpdateVariantRecordSchema>;
export type CreateVariantRecordInput = z.infer<typeof CreateVariantRecordInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                  DIMENSION VALUE MAP SCHEMAS                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const DimensionValueMapIdSchema = EntityIdSchema;
export const DimensionValueMapSchema = DrizzleDimensionValueMapSchema;
export type DimensionValueMap = DrizzleDimensionValueMap;

export const CreateDimensionValueMapSchema = DimensionValueMapSchema.omit(CreateOmissions);
export const UpdateDimensionValueMapSchema = DimensionValueMapSchema.pick({
  id: true,
}).extend(DimensionValueMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateDimensionValueMapInputSchema = CreateDimensionValueMapSchema.omit({
  id: true,
});

export type DimensionValueMapId = z.infer<typeof DimensionValueMapIdSchema>;
export type CreateDimensionValueMap = z.infer<typeof CreateDimensionValueMapSchema>;
export type UpdateDimensionValueMap = z.infer<typeof UpdateDimensionValueMapSchema>;
export type CreateDimensionValueMapInput = z.infer<typeof CreateDimensionValueMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                     COMPONENT MAP SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ComponentMapIdSchema = EntityIdSchema;
export const ComponentMapSchema = DrizzleComponentMapSchema;
export type ComponentMap = DrizzleComponentMap;

export const CreateComponentMapSchema = ComponentMapSchema.omit(CreateOmissions);
export const UpdateComponentMapSchema = ComponentMapSchema.pick({
  id: true,
}).extend(ComponentMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateComponentMapInputSchema = CreateComponentMapSchema.omit({
  id: true,
});

export type ComponentMapId = z.infer<typeof ComponentMapIdSchema>;
export type CreateComponentMap = z.infer<typeof CreateComponentMapSchema>;
export type UpdateComponentMap = z.infer<typeof UpdateComponentMapSchema>;
export type CreateComponentMapInput = z.infer<typeof CreateComponentMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                       SWITCH MAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const SwitchMapIdSchema = EntityIdSchema;
export const SwitchMapSchema = DrizzleSwitchMapSchema;
export type SwitchMap = DrizzleSwitchMap;

export const CreateSwitchMapSchema = SwitchMapSchema.omit(CreateOmissions);
export const UpdateSwitchMapSchema = SwitchMapSchema.pick({
  id: true,
}).extend(SwitchMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateSwitchMapInputSchema = CreateSwitchMapSchema.omit({
  id: true,
});

export type SwitchMapId = z.infer<typeof SwitchMapIdSchema>;
export type CreateSwitchMap = z.infer<typeof CreateSwitchMapSchema>;
export type UpdateSwitchMap = z.infer<typeof UpdateSwitchMapSchema>;
export type CreateSwitchMapInput = z.infer<typeof CreateSwitchMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      VENDOR PRICE SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const VendorPriceIdSchema = EntityIdSchema;
export const VendorPriceSchema = DrizzleVendorPriceSchema;
export type VendorPrice = DrizzleVendorPrice;

export const CreateVendorPriceSchema = VendorPriceSchema.omit({
  effectiveDate: true,
  expirationDate: true,
  isSynced: true,
  syncVersion: true,
});
export const UpdateVendorPriceSchema = VendorPriceSchema.pick({
  id: true,
}).extend(
  VendorPriceSchema.omit({
    id: true,
    effectiveDate: true,
    expirationDate: true,
    isSynced: true,
    syncVersion: true,
  }).partial().shape,
);
export const CreateVendorPriceInputSchema = CreateVendorPriceSchema.omit({
  id: true,
});

export type VendorPriceId = z.infer<typeof VendorPriceIdSchema>;
export type CreateVendorPrice = z.infer<typeof CreateVendorPriceSchema>;
export type UpdateVendorPrice = z.infer<typeof UpdateVendorPriceSchema>;
export type CreateVendorPriceInput = z.infer<typeof CreateVendorPriceInputSchema>;
