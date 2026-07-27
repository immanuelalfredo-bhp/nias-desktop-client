import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import {
  ItemRecordSchema as DrizzleItemRecordSchema,
  AliasSchema as DrizzleAliasSchema,
  DimensionMapSchema as DrizzleDimensionMapSchema,
  SystemMapSchema as DrizzleSystemMapSchema,
  TagMapSchema as DrizzleTagMapSchema,
  GenerationRulesSchema as DrizzleGenerationRulesSchema,
  type ItemRecord as DrizzleItemRecord,
  type Alias as DrizzleAlias,
  type DimensionMap as DrizzleDimensionMap,
  type SystemMap as DrizzleSystemMap,
  type TagMap as DrizzleTagMap,
  type GenerationRules as DrizzleGenerationRules,
} from '../server/schema/item.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      ITEM RECORD SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ItemRecordIdSchema = EntityIdSchema;
export const ItemRecordSchema = DrizzleItemRecordSchema;
export type ItemRecord = DrizzleItemRecord;

export const CreateItemRecordSchema = ItemRecordSchema.omit(CreateOmissions);
export const UpdateItemRecordSchema = ItemRecordSchema.pick({
  id: true,
}).extend(ItemRecordSchema.omit(UpdateOmissions).partial().shape);
export const CreateItemRecordInputSchema = CreateItemRecordSchema.omit({
  id: true,
  normalizedBaseName: true,
  normalizedDisplayName: true,
});
export const UpdateItemRecordInputSchema = UpdateItemRecordSchema.omit({
  normalizedBaseName: true,
  normalizedDisplayName: true,
});

export type ItemRecordId = z.infer<typeof ItemRecordIdSchema>;
export type CreateItemRecord = z.infer<typeof CreateItemRecordSchema>;
export type UpdateItemRecord = z.infer<typeof UpdateItemRecordSchema>;
export type CreateItemRecordInput = z.infer<typeof CreateItemRecordInputSchema>;
export type UpdateItemRecordInput = z.infer<typeof UpdateItemRecordInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         ALIAS SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const AliasIdSchema = EntityIdSchema;
export const AliasSchema = DrizzleAliasSchema;
export type Alias = DrizzleAlias;

export const CreateAliasSchema = AliasSchema.omit(CreateOmissions);
export const UpdateAliasSchema = AliasSchema.pick({
  id: true,
}).extend(AliasSchema.omit(UpdateOmissions).partial().shape);
export const CreateAliasInputSchema = CreateAliasSchema.omit({
  id: true,
  normalizedAlias: true,
});
export const UpdateAliasInputSchema = UpdateAliasSchema.omit({
  normalizedAlias: true,
});

export type AliasId = z.infer<typeof AliasIdSchema>;
export type CreateAlias = z.infer<typeof CreateAliasSchema>;
export type UpdateAlias = z.infer<typeof UpdateAliasSchema>;
export type CreateAliasInput = z.infer<typeof CreateAliasInputSchema>;
export type UpdateAliasInput = z.infer<typeof UpdateAliasInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                     DIMENSION MAP SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const DimensionMapIdSchema = EntityIdSchema;
export const DimensionMapSchema = DrizzleDimensionMapSchema;
export type DimensionMap = DrizzleDimensionMap;

export const CreateDimensionMapSchema = DimensionMapSchema.omit(CreateOmissions);
export const UpdateDimensionMapSchema = DimensionMapSchema.pick({
  id: true,
}).extend(DimensionMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateDimensionMapInputSchema = CreateDimensionMapSchema.omit({
  id: true,
});

export type DimensionMapId = z.infer<typeof DimensionMapIdSchema>;
export type CreateDimensionMap = z.infer<typeof CreateDimensionMapSchema>;
export type UpdateDimensionMap = z.infer<typeof UpdateDimensionMapSchema>;
export type CreateDimensionMapInput = z.infer<typeof CreateDimensionMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                       SYSTEM MAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const SystemMapIdSchema = EntityIdSchema;
export const SystemMapSchema = DrizzleSystemMapSchema;
export type SystemMap = DrizzleSystemMap;

export const CreateSystemMapSchema = SystemMapSchema.omit(CreateOmissions);
export const UpdateSystemMapSchema = SystemMapSchema.pick({
  id: true,
}).extend(SystemMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateSystemMapInputSchema = CreateSystemMapSchema.omit({
  id: true,
});

export type SystemMapId = z.infer<typeof SystemMapIdSchema>;
export type CreateSystemMap = z.infer<typeof CreateSystemMapSchema>;
export type UpdateSystemMap = z.infer<typeof UpdateSystemMapSchema>;
export type CreateSystemMapInput = z.infer<typeof CreateSystemMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        TAG MAP SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const TagMapIdSchema = EntityIdSchema;
export const TagMapSchema = DrizzleTagMapSchema;
export type TagMap = DrizzleTagMap;

export const CreateTagMapSchema = TagMapSchema.omit(CreateOmissions);
export const UpdateTagMapSchema = TagMapSchema.pick({
  id: true,
}).extend(TagMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateTagMapInputSchema = CreateTagMapSchema.omit({
  id: true,
});

export type TagMapId = z.infer<typeof TagMapIdSchema>;
export type CreateTagMap = z.infer<typeof CreateTagMapSchema>;
export type UpdateTagMap = z.infer<typeof UpdateTagMapSchema>;
export type CreateTagMapInput = z.infer<typeof CreateTagMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    GENERATION RULES SCHEMAS                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const GenerationRulesIdSchema = EntityIdSchema;
export const GenerationRulesSchema = DrizzleGenerationRulesSchema;
export type GenerationRules = DrizzleGenerationRules;

export const CreateGenerationRuleSchema = GenerationRulesSchema.omit(CreateOmissions);
export const UpdateGenerationRuleSchema = GenerationRulesSchema.pick({
  id: true,
}).extend(GenerationRulesSchema.omit(UpdateOmissions).partial().shape);
export const CreateGenerationRuleInputSchema = CreateGenerationRuleSchema.omit({
  id: true,
});

export type GenerationRulesId = z.infer<typeof GenerationRulesIdSchema>;
export type CreateGenerationRule = z.infer<typeof CreateGenerationRuleSchema>;
export type UpdateGenerationRule = z.infer<typeof UpdateGenerationRuleSchema>;
export type CreateGenerationRuleInput = z.infer<typeof CreateGenerationRuleInputSchema>;