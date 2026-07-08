import { z } from 'zod';
import * as schemas from './defines.js';
import { EntityIdSchema } from './common.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const UserSchema = z.object({
  id: schemas.uuid,
  username: schemas.username,
  passwordHash: schemas.passwordHash,
  displayName: schemas.displayName,
  email: schemas.email,
  isManagedBy: schemas.uuid.nullable(), // Nullable for users not managed by anyone
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(), // Nullable for non-deleted users
  isSynced: z.boolean(),
  syncVersion: schemas.syncVersion, // Nullable for users not yet synced
});

export const CreateUserSchema = UserSchema.omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export const UpdateUserSchema = UserSchema.partial().omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export const UpdateSelfSchema = UpdateUserSchema.omit({
  isManagedBy: true,
});

export const DeleteUserSchema = EntityIdSchema;

export const RestoreUserSchema = EntityIdSchema;

export const HardDeleteUserSchema = EntityIdSchema;

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateSelf = z.infer<typeof UpdateSelfSchema>;
export type DeleteUser = z.infer<typeof EntityIdSchema>;
export type RestoreUser = z.infer<typeof EntityIdSchema>;
export type HardDeleteUser = z.infer<typeof EntityIdSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          ROLE SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RoleSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50),
  normalizedName: z.string().min(1).max(50),
  isSystemRole: z.boolean().default(false),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(), // Nullable for non-deleted roles
  isSynced: z.boolean(),
  syncVersion: z.number().int().nonnegative().nullable(), // Nullable for roles not yet synced
});

export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export const UpdateRoleSchema = RoleSchema.partial().omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export type DeleteRole = z.infer<typeof EntityIdSchema>;
export type HardDeleteRole = z.infer<typeof EntityIdSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          AUDIT SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const AuditSchema = z.object({
  id: z.uuid(),
  entityId: z.uuid(),
  entityType: z.enum(['user', 'role']),
  eventType: z.enum([
    'create_user',
    'update_user',
    'delete_user',
    'hard_delete_user',
    'create_role',
    'update_role',
    'delete_role',
    'hard_delete_role',
  ]),
  performedBy: z.uuid(),
  description: z.string().min(1).max(255),
  timestamp: z.iso.datetime(),
  isSynced: z.boolean(),
  syncVersion: z.number().int().nonnegative().nullable(), // Nullable for logs not yet synced
});

export const CreateAuditSchema = AuditSchema.omit({
  id: true,
  timestamp: true,
  isSynced: true,
  syncVersion: true,
});

export type Audit = z.infer<typeof AuditSchema>;
export type CreateAudit = z.infer<typeof CreateAuditSchema>;
