import { z } from 'zod';
import {
  ServerUserSchema as DrizzleServerUserSchema,
  type ServerUser as DrizzleServerUser,
} from '../server/schema/server.js';
import * as schemas from './defines.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                       LOCAL USER SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ServerUserSchema = DrizzleServerUserSchema;
export type ServerUser = DrizzleServerUser;

// Local User Schemas
export const LocalUserSchema = ServerUserSchema.extend({
  passwordHash: schemas.passwordHash,
  syncVersion: schemas.syncVersion,
});
export const LocalUserStatusSchema = z.object({
  isEmpty: z.boolean(),
});

// Login Schemas
export const LoginSchema = LocalUserSchema.pick({
  email: true,
  passwordHash: true,
}).extend({
  password: schemas.password,
});
export const LoginInputSchema = LoginSchema.omit({
  passwordHash: true,
});
export const SupabaseSessionSchema = LocalUserSchema.pick({
  accessToken: true,
  expiresAt: true,
});

// Local User Sync Schemas
export const LocalUserSyncSchema = LocalUserSchema.pick({
  id: true,
  syncVersion: true,
}).array();
export const LocalUserSyncResponseSchema = z.object({
  users: z.array(LocalUserSchema),
  deletedUserIds: z.array(schemas.uuid),
});

export type LocalUser = z.infer<typeof LocalUserSchema>;
export type LocalUserStatus = z.infer<typeof LocalUserStatusSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type SupabaseSession = z.infer<typeof SupabaseSessionSchema>;
export type LocalUserSync = z.infer<typeof LocalUserSyncSchema>;
export type LocalUserSyncResponse = z.infer<typeof LocalUserSyncResponseSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        BOOTSTRAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const BootstrapSchema = z.object({
  displayName: schemas.displayName,
  email: schemas.email,
  password: schemas.password,
  passwordHash: schemas.passwordHash,
});

export const BootstrapInputSchema = BootstrapSchema.omit({
  passwordHash: true,
});

export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type BootstrapInput = z.infer<typeof BootstrapInputSchema>;
