import { z } from 'zod';
import { 
  UserSchema, 
  AuditLogSchema 
} from '../schema/system.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          SYNC SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

/**
 * Tracks per-table version state sent by clients when requesting sync deltas.
 */
export const SyncMetadataSchema = z.object({
  user: z.number().default(0),
  auditLog: z.number().default(0),
});

// Infer the TypeScript type from the Zod schema
export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    PROPOSED CHANGES SCHEMAS                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

/** Metadata model for change records queued for processing. */
export const ProposedChangesSchema = z.object({
  id: z.uuid({ version: 'v7' }),
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
  id: z.uuid({ version: 'v7' }),
  actorId: z.uuid({ version: 'v7' }),
  changes: z.array(
    z.discriminatedUnion('tableName', [
      z.object({
        id: z.uuid({ version: 'v7' }),
        tableName: z.literal('user'),
        payload: UserSchema.partial()
      }),
      z.object({
        id: z.uuid({ version: 'v7' }),
        tableName: z.literal('auditLog'),
        payload: AuditLogSchema.partial()
      })
    ])
  ),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;