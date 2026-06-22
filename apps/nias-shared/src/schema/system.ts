import { z } from 'zod';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

const argon2Regex = new RegExp(
  '^\\$argon2(?:i|d|id)\\$v=\\d+\\$m=\\d+,t=\\d+,p=\\d+' +
    '\\$[A-Za-z0-9+/]+={0,2}\\$[A-Za-z0-9+/]+={0,2}$'
);

// Define the Zod schema for an entity ID (UUID v7)
export const EntityIdSchema = z.object({
  id: z.uuid({ version: 'v7' }),
});

// Define the Zod schema for a User
export const UserSchema = z.object({
  id: z.uuid({ version: 'v7' }),
  username: z.string().min(3).max(20),
  passwordHash: z.string().regex(argon2Regex),
  displayName: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  isManagedBy: z.uuid({ version: 'v7' }).nullable(), // Nullable for users not managed by anyone
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(), // Nullable for non-deleted users
  isSynced: z.boolean(),
  syncVersion: z.number().int().nonnegative().nullable(), // Nullable for users not yet synced
});

// Define the Zod schema for creating a new User (without id, timestamps, and sync fields)
export const CreateUserSchema = UserSchema.omit({
  id: true,
  isManagedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

// Define the Zod schema for updating an existing User (without id, timestamps, and sync fields)
export const UpdateUserSchema = UserSchema.partial().omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

// Define the Zod schema for updating the current user's own profile (without isManagedBy,
// timestamps, and sync fields)
export const UpdateSelfSchema = UpdateUserSchema.omit({
  isManagedBy: true,
});

// Infer the TypeScript type from the Zod schema
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateSelf = z.infer<typeof UpdateSelfSchema>;
export type DeleteUser = z.infer<typeof EntityIdSchema>;
export type HardDeleteUser = z.infer<typeof EntityIdSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          ROLE SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the Zod schema for a Role
export const RoleSchema = z.object({
  id: z.uuid({ version: 'v7' }),
  name: z.string().min(1).max(50),
  normalizedName: z.string().min(1).max(50),
  isSystemRole: z.boolean().default(false),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(), // Nullable for non-deleted roles
  isSynced: z.boolean(),
  syncVersion: z.number().int().nonnegative().nullable(), // Nullable for roles not yet synced
});

// For creation, we omit the ID (since it will be generated), the timestamps, 
// and the sync fields
export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

// For updates, all fields are optional except for the ID, and we also omit 
// the timestamps and sync fields
export const UpdateRoleSchema = RoleSchema.partial().omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  isSynced: true,
  syncVersion: true,
});

// Infer the TypeScript type from the Zod schema
export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export type DeleteRole = z.infer<typeof EntityIdSchema>;
export type HardDeleteRole = z.infer<typeof EntityIdSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          AUDIT SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

// Define the Zod schema for an Audit Log entry
export const AuditLogSchema = z.object({
  id: z.uuid({ version: 'v7' }),
  entityId: z.uuid({ version: 'v7' }),
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
  performedBy: z.uuid({ version: 'v7' }),
  description: z.string().min(1).max(255),
  timestamp: z.iso.datetime(),
  isSynced: z.boolean(),
  syncVersion: z.number().int().nonnegative().nullable(), // Nullable for logs not yet synced
});

export const CreateAuditLogSchema = AuditLogSchema.omit({
  id: true,
  timestamp: true,
  isSynced: true,
  syncVersion: true,
});

// Infer the TypeScript type from the Zod schema
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;
