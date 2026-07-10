import { z } from 'zod';
import {
  SyncMetadataSchema as DrizzleSyncMetadataSchema,
  ChangelogSchema as DrizzleChangelogSchema,
  type SyncMetadata as DrizzleSyncMetadata,
  type Changelog as DrizzleChangelog,
} from '../server/schema/sync.js';
import * as schemas from './defines.js';
import { UserSchema } from '../server/schema/system.js';

export const SyncMetadataSchema = DrizzleSyncMetadataSchema;
export const ChangelogSchema = DrizzleChangelogSchema;
export type SyncMetadata = DrizzleSyncMetadata;
export type Changelog = DrizzleChangelog;

export const UserSyncVersionSchema = z.object({
  userId: schemas.uuid,
  syncVersion: schemas.syncVersion,
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
      table: schemas.genericString,
      data: schemas.genericBlob,
    }),
  ),
});

export type UserSyncVersion = z.infer<typeof UserSyncVersionSchema>;
export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type PullManifest = z.infer<typeof PullManifestSchema>;
export type PushResponse = z.infer<typeof PushResponseSchema>;
