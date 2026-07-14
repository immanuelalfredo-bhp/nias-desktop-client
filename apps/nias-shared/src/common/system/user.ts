import { z } from 'zod';
import { EntityIdSchema } from '../common.js';
import * as schemas from '../defines.js';
import {
  UserSchema as DrizzleUserSchema,
  type User as DrizzleUser,
} from '../../server/schema/system.js';
import { CreateOmissions, UpdateOmissions } from '../defines.js';

export const UserIdSchema = EntityIdSchema;
export const UserSchema = DrizzleUserSchema;
export type User = DrizzleUser;

export const CreateUserSchema = UserSchema.omit(CreateOmissions);
export const UpdateUserSchema = UserSchema.pick({ id: true }).extend(
  UserSchema.omit(UpdateOmissions).partial().shape,
);
export const UpdateSelfSchema = UpdateUserSchema.omit({ isManagedBy: true });
export const CreateUserInputSchema = CreateUserSchema.omit({ passwordHash: true }).extend({
  password: schemas.password,
});
export const UpdateUserInputSchema = UpdateUserSchema.omit({ passwordHash: true }).extend({
  password: schemas.password.optional(),
});
export const UpdateSelfInputSchema = UpdateSelfSchema.omit({ passwordHash: true }).extend({
  password: schemas.password.optional(),
});
export const CreateUserPayloadSchema = CreateUserSchema.extend({
  password: schemas.password,
});

export type UserId = z.infer<typeof UserIdSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateSelf = z.infer<typeof UpdateSelfSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateSelfInput = z.infer<typeof UpdateSelfInputSchema>;
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

// export const CreateBrandSchema = BrandSchema.omit(CreateOmissions);
// export const UpdateBrandSchema = BrandSchema.pick({
//   id: true,
// }).extend(BrandSchema.omit(UpdateOmissions).partial().shape);
// export const CreateBrandInputSchema = CreateBrandSchema.omit({ normalizedName: true });
// export const UpdateBrandInputSchema = UpdateBrandSchema.omit({ normalizedName: true });

// export type BrandId = z.infer<typeof BrandIdSchema>;
// export type CreateBrand = z.infer<typeof CreateBrandSchema>;
// export type UpdateBrand = z.infer<typeof UpdateBrandSchema>;
// export type CreateBrandInput = z.infer<typeof CreateBrandInputSchema>;
// export type UpdateBrandInput = z.infer<typeof UpdateBrandInputSchema>;

export const CreateUserResponseSchema = UserSchema.omit({
  displayName: true,
  email: true,
  passwordHash: true,
  isManagedBy: true,
  deletedAt: true,
  isSynced: true,
});
