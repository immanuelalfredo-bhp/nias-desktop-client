import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import * as schemas from './defines.js';
import {
  UserSchema as DrizzleUserSchema,
  AuditSchema as DrizzleAuditSchema,
  type User as DrizzleUser,
  type Audit as DrizzleAudit,
} from '../server/schema/system.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const UserIdSchema = EntityIdSchema;
export const UserSchema = DrizzleUserSchema;
export type User = DrizzleUser;

export const CreateUserSchema = UserSchema.omit(CreateOmissions);
export const CreateUserPayloadSchema = CreateUserSchema.omit({ id: true }).extend({
  password: schemas.password,
});
export const CreateUserInputSchema = CreateUserPayloadSchema.omit({ passwordHash: true })
export const CreateUserResponseSchema = UserSchema.pick({ id: true, ...CreateOmissions }).omit({
  deletedAt: true,
  isSynced: true,
});

export const UpdateUserSchema = UserSchema.pick({ id: true }).extend(
  UserSchema.omit(UpdateOmissions).partial().shape,
);
export const UpdateUserPayloadSchema = UpdateUserSchema.omit({ id: true }).partial().extend({
  id: schemas.uuid,
  password: schemas.password.optional(),
});
export const UpdateUserInputSchema = UpdateUserPayloadSchema.omit({ passwordHash: true });
export const UpdateUserResponseSchema = UserSchema.pick(UpdateOmissions).omit({
  createdAt: true,
  deletedAt: true,
  isSynced: true,
});

export type UserId = z.infer<typeof UserIdSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateUserPayload = z.infer<typeof UpdateUserPayloadSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                         AUDIT SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const AuditIdSchema = EntityIdSchema;
export const AuditSchema = DrizzleAuditSchema;
export type Audit = DrizzleAudit;

export const CreateAuditSchema = AuditSchema.omit({
  isSynced: true,
  syncVersion: true,
});
export const CreateAuditInputSchema = CreateAuditSchema.omit({
  id: true,
  timestamp: true,
  userId: true,
  details: true,
}).extend({
  recordName: schemas.string,
});

export type AuditId = z.infer<typeof AuditIdSchema>;
export type CreateAudit = z.infer<typeof CreateAuditSchema>;
export type CreateAuditInput = z.infer<typeof CreateAuditInputSchema>;
