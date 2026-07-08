import { z } from 'zod';
import * as schemas from './defines.js';
import { AuditSchema, UserSchema } from '../schema/system.js';

export const SyncMetadataSchema = z.object({
  users: schemas.syncVersion,
  audit: schemas.syncVersion,
});

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
    audit: z.array(AuditSchema),
  }),
});

export const PushResponseSchema = z.object({
  syncedItems: z.array(
    z.object({
      table: schemas.genericString,
      data: schemas.genericBlob,
    }),
  ),
});

export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;
export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type PullManifest = z.infer<typeof PullManifestSchema>;
export type PushResponse = z.infer<typeof PushResponseSchema>;
