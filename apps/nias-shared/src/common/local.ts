import { z } from 'zod';
import * as schemas from './defines.js';

export const UserSchema = z.object({
  id: schemas.uuid,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
  accessToken: schemas.string,
  refreshToken: schemas.string,
  expiresAt: schemas.dateTime,
  syncVersion: schemas.syncVersion,
});

export const UserDataSchema = UserSchema.omit({
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

export const UserSyncSchema = z.object({
  id: z.array(schemas.uuid),
  syncVersion: z.array(schemas.syncVersion),
});

export const UserSyncDeltaSchema = z.object({
  upsert: z.array(UserDataSchema),
  delete: z.array(schemas.uuid),
});

export type User = z.infer<typeof UserSchema>;
export type UserData = z.infer<typeof UserDataSchema>;
export type UserSync = z.infer<typeof UserSyncSchema>;
export type UserSyncDelta = z.infer<typeof UserSyncDeltaSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        BOOTSTRAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const BootstrapStatusSchema = z.object({
  isEmpty: z.boolean(),
});

export const BootstrapSchema = UserSchema.omit({
  id: true,
  accessToken: true,
  expiresAt: true,
  syncVersion: true,
  refreshToken: true,
}).extend({
  displayName: schemas.displayName,
  password: schemas.password,
});

export const BootstrapInputSchema = BootstrapSchema.omit({
  passwordHash: true,
}).extend({
  bootstrapKey: schemas.string,
});

export const BootstrapResponseSchema = UserSchema.pick({
  id: true,
  accessToken: true,
  expiresAt: true,
  refreshToken: true,
  syncVersion: true,
});

export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type BootstrapStatus = z.infer<typeof BootstrapStatusSchema>;
export type BootstrapInput = z.infer<typeof BootstrapInputSchema>;
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         LOGIN SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const LoginSchema = BootstrapSchema.pick({
  email: true,
  password: true,
});

export const LoginResponseSchema = BootstrapResponseSchema

export type Login = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
