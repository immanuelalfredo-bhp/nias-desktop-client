import { z } from 'zod';
import { 
  UserSchema, 
  AuditSchema 
} from '../schema/system.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          SYNC SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

/**
 * Tracks per-table version state sent by clients when requesting sync deltas.
 */
export const SyncMetadataSchema = z.object({
  users: z.number().default(0),
  audit: z.number().default(0),
});

// Infer the TypeScript type from the Zod schema
export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    PROPOSED CHANGES SCHEMAS                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

/** Metadata model for change records queued for processing. */
export const ProposedChangesSchema = z.object({
  id: z.uuid(),
  tableName: z.string().min(1).max(100),
  payload: z.string().min(1), // JSON string representing the proposed changes
  status: z.enum(['pending', 'processed', 'rejected']),
  createdAt: z.iso.datetime(),
  processedAt: z.iso.datetime(),
});

// Infer the TypeScript type from the Zod schema
export type ProposedChanges = z.infer<typeof ProposedChangesSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      PUSH PAYLOAD SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

/** Payload schema accepted by sync push endpoint. */
export const PushPayloadSchema = z.object({
  id: z.uuid(),
  actorId: z.uuid(),
  changes: z.array(
    z.discriminatedUnion('tableName', [
      z.object({
        id: z.uuid(),
        tableName: z.literal('users'),
        payload: UserSchema.partial()
      }),
      z.object({
        id: z.uuid(),
        tableName: z.literal('audit'),
        payload: AuditSchema.partial()
      })
    ])
  ),
});

export const AuthUsernameSchema = z.object({
  id: z.uuid(),
  username: z.string().min(1).max(100),
  password: z.string().min(1),
});

export const AuthUserIdsSchema = z.object({
  id: z.array(z.uuid()),
  username: z.array(z.string().min(1).max(100)),
  passwordHash: z.array(z.string().min(1)),
  syncVersion: z.array(z.number().int().nonnegative()),
});

export type AuthUsername = z.infer<typeof AuthUsernameSchema>;
export type AuthUserIds = z.infer<typeof AuthUserIdsSchema>;
export type PushPayload = z.infer<typeof PushPayloadSchema>;