import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import {
  VariantRecordSchema as DrizzleVariantRecordSchema,
  DimensionValueMapSchema as DrizzleDimensionValueMapSchema,
  type VariantRecord as DrizzleVariantRecord,
  type DimensionValueMap as DrizzleDimensionValueMap,
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