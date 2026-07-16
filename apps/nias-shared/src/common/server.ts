import { z } from 'zod';
import {
  SyncMetadataSchema as DrizzleSyncMetadataSchema,
  type SyncMetadata as DrizzleSyncMetadata,
} from '../server/schema/server.js';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
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

export const SyncMetadataSchema = DrizzleSyncMetadataSchema;
export type SyncMetadata = DrizzleSyncMetadata;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      SERVER USER SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const PushPayloadSchema = z.object({
  id: schemas.uuid,
  actorId: schemas.uuid,
  changes: z.array(
    z.discriminatedUnion('tableName', [
      z.object({
        id: schemas.uuid,
        tableName: z.literal('users'),
        payload: UserSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('roles'),
        payload: RoleSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('projects'),
        payload: ProjectSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('role_capabilities'),
        payload: RoleCapabilitiesSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('role_management'),
        payload: RoleManagementSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('role_map'),
        payload: RoleMapSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('project_map'),
        payload: ProjectMapSchema.partial(),
      }),
      z.object({
        id: schemas.uuid,
        tableName: z.literal('audit'),
        payload: AuditSchema.partial(),
      }),
    ]),
  ),
});

export const PullManifestSchema = z.object({
  latestVersions: SyncMetadataSchema,
  hasMore: z.boolean(),
  changes: z.object({
    users: z.array(UserSchema),
  }),
});

export const PushResponseSchema = z.object({
  syncedItems: z.array(
    z.object({
      table: schemas.string,
      data: schemas.blob,
    }),
  ),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type PullManifest = z.infer<typeof PullManifestSchema>;
export type PushResponse = z.infer<typeof PushResponseSchema>;
