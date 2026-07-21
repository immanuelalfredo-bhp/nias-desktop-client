import { boolean, jsonb, integer, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import * as schemas from '../../common/defines.js';

export const systemSchema = pgSchema('system');

const systemBaseFields = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
};

const systemOverrides = {
  createdAt: schemas.dateTime,
  updatedAt: schemas.dateTime,
  deletedAt: schemas.dateTime.nullable(),
};

export const users = systemSchema.table('users', {
  ...systemBaseFields,
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  isManagedBy: uuid('is_managed_by'),
});

export const roles = systemSchema.table('roles', {
  ...systemBaseFields,
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
});

export const projects = systemSchema.table('projects', {
  ...systemBaseFields,
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  soNumber: text('so_number'),
  poNumber: text('po_number'),
});

export const roleCapabilities = systemSchema.table('role_capabilities', {
  ...systemBaseFields,
  roleId: uuid('role_id').notNull(),
  capability: text('capability').notNull(),
});

export const roleManagement = systemSchema.table('role_management', {
  ...systemBaseFields,
  roleId: uuid('role_id').notNull(),
  managedRoleId: uuid('managed_role_id').notNull(),
});

export const roleMap = systemSchema.table('role_map', {
  ...systemBaseFields,
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
});

export const projectMap = systemSchema.table('project_map', {
  ...systemBaseFields,
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),
});

export const audit = systemSchema.table('audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  timestamp: timestamp('timestamp', { mode: 'string' }).defaultNow().notNull(),
  details: jsonb('details').notNull(),
  isSynced: boolean('is_synced').default(false).notNull(),
  syncVersion: integer('sync_version').notNull(),
});

export const UserSchema = createSelectSchema(users, {
  ...systemOverrides,
  displayName: schemas.displayName,
  email: schemas.email,
  passwordHash: schemas.passwordHash,
});

export const RoleSchema = createSelectSchema(roles, {
  ...systemOverrides,
  name: schemas.string,
  normalizedName: schemas.slug,
});

export const ProjectSchema = createSelectSchema(projects, {
  ...systemOverrides,
  name: schemas.string,
  normalizedName: schemas.slug,
  soNumber: schemas.string.nullable(),
  poNumber: schemas.string.nullable(),
});

export const RoleCapabilitiesSchema = createSelectSchema(roleCapabilities, {
  ...systemOverrides,
  capability: schemas.string,
});

export const RoleManagementSchema = createSelectSchema(roleManagement, {
  ...systemOverrides,
});

export const RoleMapSchema = createSelectSchema(roleMap, {
  ...systemOverrides,
});

export const ProjectMapSchema = createSelectSchema(projectMap, {
  ...systemOverrides,
});

export const AuditSchema = createSelectSchema(audit, {
  action: schemas.string,
  tableName: schemas.string,
  recordId: schemas.string,
  timestamp: schemas.dateTime,
  details: schemas.jsonb,
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type RoleCapabilities = typeof roleCapabilities.$inferSelect;
export type RoleManagement = typeof roleManagement.$inferSelect;
export type RoleMap = typeof roleMap.$inferSelect;
export type ProjectMap = typeof projectMap.$inferSelect;
export type Audit = typeof audit.$inferSelect;