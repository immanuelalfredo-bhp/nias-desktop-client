import { z } from 'zod';
import { EntityIdSchema } from './common.js';
import * as schemas from './defines.js';
import {
  UserSchema as DrizzleUserSchema,
  type User as DrizzleUser,
} from '../server/schema/system.js';

export const UserSchema = DrizzleUserSchema;
export const DeleteUserSchema = EntityIdSchema;
export const RestoreUserSchema = EntityIdSchema;
export const HardDeleteUserSchema = EntityIdSchema;

export type User = DrizzleUser;

export const CreateUserSchema = UserSchema.extend({
  password: schemas.password,
}).omit({
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

export const CreateUserInputSchema = CreateUserSchema.omit({
  passwordHash: true,
});

export const UpdateUserInputSchema = UpdateUserSchema.extend({
  password: schemas.password,
}).omit({
  passwordHash: true,
});

export const UpdateSelfInputSchema = UpdateSelfSchema.extend({
  password: schemas.password,
}).omit({
  passwordHash: true,
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateSelf = z.infer<typeof UpdateSelfSchema>;
export type DeleteUser = z.infer<typeof EntityIdSchema>;
export type RestoreUser = z.infer<typeof EntityIdSchema>;
export type HardDeleteUser = z.infer<typeof EntityIdSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateSelfInput = z.infer<typeof UpdateSelfInputSchema>;