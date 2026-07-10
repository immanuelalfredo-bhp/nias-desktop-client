import { z } from 'zod';
import * as schemas from './defines.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        BOOTSTRAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const BootstrapPayloadSchema = z.object({
  displayName: schemas.displayName,
  email: schemas.email,
  password: schemas.password,
  passwordHash: schemas.passwordHash,
});

export const BootstrapInputSchema = BootstrapPayloadSchema.omit({
  passwordHash: true,
});

export type BootstrapPayload = z.infer<typeof BootstrapPayloadSchema>;
export type BootstrapInput = z.infer<typeof BootstrapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          LOGIN SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const LocalUserSchema = z.object({
  id: schemas.uuid,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
  jwtToken: schemas.jwtToken.optional(),
  jwtTokenExpiration: schemas.jwtTokenExpiration.optional(),
  syncVersion: schemas.syncVersion,
});

export const LoginCredentialsSchema = z.object({
  email: schemas.email,
  password: schemas.password,
});

export const LoginDataSchema = z.object({
  id: schemas.uuid,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
  syncVersion: schemas.syncVersion,
  jwtToken: schemas.jwtToken,
  jwtTokenExpiration: schemas.jwtTokenExpiration,
});

export const LoginSyncStateSchema = z.array(
  z.object({
    id: schemas.uuid,
    syncVersion: schemas.syncVersion,
  }),
);

export const LoginSyncDeltaSchema = z.object({
  changes: z.array(LoginDataSchema),
  deletedUserIds: z.array(schemas.uuid),
});

export const StatusResponseSchema = z.object({
  isEmpty: z.boolean(),
});

export const SupabaseSessionSchema = z.object({
  accessToken: schemas.jwtToken,
  expiresAt: z.date(),
});

export type LocalUser = z.infer<typeof LocalUserSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
export type LoginSyncState = z.infer<typeof LoginSyncStateSchema>;
export type LoginSyncDelta = z.infer<typeof LoginSyncDeltaSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type SupabaseSession = z.infer<typeof SupabaseSessionSchema>;
