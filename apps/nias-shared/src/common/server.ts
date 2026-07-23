import { z } from 'zod';
import {
  type SyncMetadata as DrizzleSyncMetadata,
  SYNC_TABLE_MAP,
  type SyncTableKey,
  type SyncTableName,
} from '../server/schema/server.js';
import * as schemas from './defines.js';
import {
  UserSchema,
  RoleSchema,
  ProjectSchema,
  RoleCapabilitiesSchema,
  RoleManagementSchema,
  RoleMapSchema,
  ProjectMapSchema,
  AuditSchema,
} from '../server/schema/system.js';
import {
  BrandSchema,
  ModeSchema,
  UomSchema,
  DimensionSchema,
  DimensionValueSchema,
  SystemSchema,
  CategorySchema,
  VendorSchema,
  TagSchema,
} from '../server/schema/attribute.js';
import {
  ItemRecordSchema,
  AliasSchema,
  BrandlineMapSchema,
  VendorMapSchema,
  DimensionMapSchema,
  SystemMapSchema,
  TagMapSchema,
  GenerationRulesSchema,
} from '../server/schema/item.js';
import {
  VariantRecordSchema,
  DimensionValueMapSchema,
  ComponentMapSchema,
  SwitchMapSchema,
  VendorPriceSchema,
} from '../server/schema/variant.js';
import { RequestSchema, RequestItemSchema } from '../server/schema/order.js';

export const SyncMetadataSchema = schemas.syncMetadata;
export type SyncMetadata = DrizzleSyncMetadata;

const PayloadSchemaByTableName = {
  users: UserSchema,
  // roles: RoleSchema,
  // projects: ProjectSchema,
  // role_capabilities: RoleCapabilitiesSchema,
  // role_management: RoleManagementSchema,
  // role_map: RoleMapSchema,
  // project_map: ProjectMapSchema,
  audit: AuditSchema,
  brands: BrandSchema,
  modes: ModeSchema,
  uoms: UomSchema,
  dimensions: DimensionSchema,
  dimension_values: DimensionValueSchema,
  systems: SystemSchema,
  categories: CategorySchema,
  vendors: VendorSchema,
  tags: TagSchema,
  // item_records: ItemRecordSchema,
  // aliases: AliasSchema,
  // brandline_map: BrandlineMapSchema,
  // vendor_map: VendorMapSchema,
  // dimension_map: DimensionMapSchema,
  // system_map: SystemMapSchema,
  // tag_map: TagMapSchema,
  // generation_rules: GenerationRulesSchema,
  // variant_records: VariantRecordSchema,
  // dimension_value_map: DimensionValueMapSchema,
  // component_map: ComponentMapSchema,
  // switch_map: SwitchMapSchema,
  // vendor_price: VendorPriceSchema,
  // requests: RequestSchema,
  // request_items: RequestItemSchema,
} as const satisfies Record<SyncTableName, z.ZodTypeAny>;

const PushChangeSchemaList = SYNC_TABLE_MAP.map(({ tableName }) =>
  z.object({
    id: schemas.uuid,
    tableName: z.literal(tableName),
    payload: PayloadSchemaByTableName[tableName].partial(),
  }),
);

const PullChangesShape = Object.fromEntries(
  SYNC_TABLE_MAP.map(({ key, tableName }) => [key, z.array(PayloadSchemaByTableName[tableName])]),
) as unknown as Record<SyncTableKey, z.ZodArray<z.ZodTypeAny>>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      SERVER USER SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const TokenSchema = z.object({
  accessToken: schemas.token,
  refreshToken: schemas.token,
  expiresAt: schemas.dateTime,
});

export const RefreshTokenSchema = TokenSchema.pick({
  refreshToken: true,
});

export type Token = z.infer<typeof TokenSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export const PushPayloadSchema = z.object({
  id: schemas.uuid,
  actorId: schemas.uuid,
  changes: z.array(
    z.discriminatedUnion(
      'tableName',
      PushChangeSchemaList as [
        (typeof PushChangeSchemaList)[number],
        (typeof PushChangeSchemaList)[number],
        ...(typeof PushChangeSchemaList)[number][],
      ],
    ),
  ),
});

export const PullResponseSchema = z.object({
  latestVersions: SyncMetadataSchema,
  hasMore: z.boolean(),
  changes: z.object(PullChangesShape),
});

export const PushResponseSchema = z.object({
  syncedItems: z.array(
    z.object({
      table: schemas.string,
      data: z.array(z.unknown()),
    }),
  ),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type PullResponse = z.infer<typeof PullResponseSchema>;
export type PushResponse = z.infer<typeof PushResponseSchema>;
