import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import * as schemas from './defines.js';
import {
  UserSchema as DrizzleUserSchema,
  RoleSchema as DrizzleRoleSchema,
  ProjectSchema as DrizzleProjectSchema,
  RoleCapabilitiesSchema as DrizzleRoleCapabilitiesSchema,
  RoleManagementSchema as DrizzleRoleManagementSchema,
  RoleMapSchema as DrizzleRoleMapSchema,
  ProjectMapSchema as DrizzleProjectMapSchema,
  AuditSchema as DrizzleAuditSchema,
  type User as DrizzleUser,
  type Role as DrizzleRole,
  type Project as DrizzleProject,
  type RoleCapabilities as DrizzleRoleCapabilities,
  type RoleManagement as DrizzleRoleManagement,
  type RoleMap as DrizzleRoleMap,
  type ProjectMap as DrizzleProjectMap,
  type Audit as DrizzleAudit,
} from '../server/schema/system.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          USER SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const UserIdSchema = EntityIdSchema;
export const UserSchema = DrizzleUserSchema;
export type User = DrizzleUser;

export const CreateUserSchema = UserSchema.omit(CreateOmissions);
export const UpdateUserSchema = UserSchema.pick({
  id: true,
}).extend(UserSchema.omit(UpdateOmissions).partial().shape);
export const UpdateSelfSchema = UpdateUserSchema.omit({ isManagedBy: true });
export const CreateUserInputSchema = CreateUserSchema.omit({ id: true, passwordHash: true }).extend(
  {
    password: schemas.password,
  },
);
export const UpdateUserInputSchema = UpdateUserSchema.omit({ passwordHash: true }).extend({
  password: schemas.password.optional(),
});
export const UpdateSelfInputSchema = UpdateSelfSchema.omit({ passwordHash: true }).extend({
  password: schemas.password.optional(),
});

export type UserId = z.infer<typeof UserIdSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateSelf = z.infer<typeof UpdateSelfSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateSelfInput = z.infer<typeof UpdateSelfInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                          ROLE SCHEMAS                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RoleIdSchema = EntityIdSchema;
export const RoleSchema = DrizzleRoleSchema;
export type Role = DrizzleRole;

export const CreateRoleSchema = RoleSchema.omit(CreateOmissions);
export const UpdateRoleSchema = RoleSchema.pick({
  id: true,
}).extend(RoleSchema.omit(UpdateOmissions).partial().shape);
export const CreateRoleInputSchema = CreateRoleSchema.omit({ id: true, normalizedName: true });
export const UpdateRoleInputSchema = UpdateRoleSchema.omit({ normalizedName: true });

export type RoleId = z.infer<typeof RoleIdSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleInputSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        PROJECT SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ProjectIdSchema = EntityIdSchema;
export const ProjectSchema = DrizzleProjectSchema;
export type Project = DrizzleProject;

export const CreateProjectSchema = ProjectSchema.omit(CreateOmissions);
export const UpdateProjectSchema = ProjectSchema.pick({
  id: true,
  poNumber: true,
  soNumber: true,
}).extend(
  ProjectSchema.omit({ ...UpdateOmissions, poNumber: true, soNumber: true }).partial().shape,
);
export const CreateProjectInputSchema = CreateProjectSchema.omit({
  id: true,
  normalizedName: true,
});
export const UpdateProjectInputSchema = UpdateProjectSchema.omit({ normalizedName: true });

export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    ROLE CAPABILITY SCHEMAS                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RoleCapabilityIdSchema = EntityIdSchema;
export const RoleCapabilitySchema = DrizzleRoleCapabilitiesSchema;
export type RoleCapability = DrizzleRoleCapabilities;

export const CreateRoleCapabilitySchema = RoleCapabilitySchema.omit(CreateOmissions);
export const UpdateRoleCapabilitySchema = RoleCapabilitySchema.pick({
  id: true,
}).extend(RoleCapabilitySchema.omit(UpdateOmissions).partial().shape);
export const CreateRoleCapabilityInputSchema = CreateRoleCapabilitySchema.omit({ id: true });

export type RoleCapabilityId = z.infer<typeof RoleCapabilityIdSchema>;
export type CreateRoleCapability = z.infer<typeof CreateRoleCapabilitySchema>;
export type UpdateRoleCapability = z.infer<typeof UpdateRoleCapabilitySchema>;
export type CreateRoleCapabilityInput = z.infer<typeof CreateRoleCapabilityInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                    ROLE MANAGEMENT SCHEMAS                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RoleManagementIdSchema = EntityIdSchema;
export const RoleManagementSchema = DrizzleRoleManagementSchema;
export type RoleManagement = DrizzleRoleManagement;

export const CreateRoleManagementSchema = RoleManagementSchema.omit(CreateOmissions);
export const UpdateRoleManagementSchema = RoleManagementSchema.pick({
  id: true,
}).extend(RoleManagementSchema.omit(UpdateOmissions).partial().shape);
export const CreateRoleManagementInputSchema = CreateRoleManagementSchema.omit({ id: true });

export type RoleManagementId = z.infer<typeof RoleManagementIdSchema>;
export type CreateRoleManagement = z.infer<typeof CreateRoleManagementSchema>;
export type UpdateRoleManagement = z.infer<typeof UpdateRoleManagementSchema>;
export type CreateRoleManagementInput = z.infer<typeof CreateRoleManagementInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        ROLE MAP SCHEMAS                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RoleMapIdSchema = EntityIdSchema;
export const RoleMapSchema = DrizzleRoleMapSchema;
export type RoleMap = DrizzleRoleMap;

export const CreateRoleMapSchema = RoleMapSchema.omit(CreateOmissions);
export const UpdateRoleMapSchema = RoleMapSchema.pick({
  id: true,
}).extend(RoleMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateRoleMapInputSchema = CreateRoleMapSchema.omit({ id: true });

export type RoleMapId = z.infer<typeof RoleMapIdSchema>;
export type CreateRoleMap = z.infer<typeof CreateRoleMapSchema>;
export type UpdateRoleMap = z.infer<typeof UpdateRoleMapSchema>;
export type CreateRoleMapInput = z.infer<typeof CreateRoleMapInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      PROJECT MAP SCHEMAS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const ProjectMapIdSchema = EntityIdSchema;
export const ProjectMapSchema = DrizzleProjectMapSchema;
export type ProjectMap = DrizzleProjectMap;

export const CreateProjectMapSchema = ProjectMapSchema.omit(CreateOmissions);
export const UpdateProjectMapSchema = ProjectMapSchema.pick({
  id: true,
}).extend(ProjectMapSchema.omit(UpdateOmissions).partial().shape);
export const CreateProjectMapInputSchema = CreateProjectMapSchema.omit({ id: true });

export type ProjectMapId = z.infer<typeof ProjectMapIdSchema>;
export type CreateProjectMap = z.infer<typeof CreateProjectMapSchema>;
export type UpdateProjectMap = z.infer<typeof UpdateProjectMapSchema>;
export type CreateProjectMapInput = z.infer<typeof CreateProjectMapInputSchema>;

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
export const UpdateAuditSchema = AuditSchema.pick({
  id: true,
}).extend(AuditSchema.omit({
  id: true,
  isSynced: true,
  syncVersion: true,
}).partial().shape);
export const CreateAuditInputSchema = CreateAuditSchema.omit({ id: true });


export type AuditId = z.infer<typeof AuditIdSchema>;
export type CreateAudit = z.infer<typeof CreateAuditSchema>;
export type UpdateAudit = z.infer<typeof UpdateAuditSchema>;
export type CreateAuditInput = z.infer<typeof CreateAuditInputSchema>;
