import { z } from 'zod';

const usernameSchema = z.string().trim().min(1).max(100);
const passwordSchema = z.string().min(1);
const syncVersionSchema = z.number().int().nonnegative();

export const LoginCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const RemoteUserRecordSchema = z.object({
  id: z.uuid(),
  username: usernameSchema,
  passwordHash: z.string().min(1),
  syncVersion: syncVersionSchema,
});

export const UserSyncStateSchema = z.object({
  id: z.uuid(),
  syncVersion: syncVersionSchema,
});

export const UserSyncStateListSchema = z.array(UserSyncStateSchema);

export const UserSyncDeltaSchema = z.object({
  changes: z.array(RemoteUserRecordSchema),
  deletedUserIds: z.array(z.uuid()),
});

export const BootstrapAccountSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(100).optional().default(''),
  email: z.email().optional().or(z.literal('')).default(''),
  password: passwordSchema,
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RemoteUserRecord = z.infer<typeof RemoteUserRecordSchema>;
export type UserSyncState = z.infer<typeof UserSyncStateSchema>;
export type UserSyncDelta = z.infer<typeof UserSyncDeltaSchema>;
export type BootstrapAccount = z.infer<typeof BootstrapAccountSchema>;
