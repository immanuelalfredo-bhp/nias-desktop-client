import { z } from 'zod';
import * as schemas from './defines.js'

export const BootstrapPayloadSchema = z.object({
  username: schemas.username,
  displayName: schemas.displayName,
  email: schemas.email,
  password: schemas.password,
  passwordHash: schemas.passwordHash,
});

export const LoginCredentialsSchema = z.object({
  username: schemas.username,
  email: schemas.email,
  password: schemas.password,
});

export const LoginDataSchema = z.object({
  success: z.boolean(),
  id: schemas.uuid,
  username: schemas.username,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
  syncVersion: schemas.syncVersion,
  jwtToken: schemas.jwtToken,
  jwtTokenExpiration: schemas.jwtTokenExpiration,
});

export const LoginSyncStateSchema = z.object({
  id: schemas.uuid,
  syncVersion: schemas.syncVersion,
});

export const LoginSyncDeltaSchema = z.object({
  success: z.boolean(),
  changes: z.array(LoginDataSchema),
  deletedUserIds: z.array(schemas.uuid),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type BootstrapPayload = z.infer<typeof BootstrapPayloadSchema>;
export type LoginData = z.infer<typeof LoginDataSchema>;
export type LoginSyncState = z.infer<typeof LoginSyncStateSchema>;
export type LoginSyncDelta = z.infer<typeof LoginSyncDeltaSchema>;

export const BootstrapResponseSchema = z.object({
  success: z.boolean(),
  adminId: z.string().optional(),
});

export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;