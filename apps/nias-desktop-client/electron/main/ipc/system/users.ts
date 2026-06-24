// // import { randomUUID } from 'node:crypto';
// import { ipcMain } from 'electron';
// import { AppDatabase } from '../../../db/database';
// // import { hashPassword } from '../../auth/credentials';
// // import { en as t } from '../../locales/en';
// // import {
// //   canModifyUsers,
// //   canActorManageTarget,
// //   canRestoreUsers,
// //   getAdminRoleOrThrow,
// //   canViewInactiveUsers,
// //   createUserSchema,
// //   deleteUserSchema,//   updateUserSchema,
// //   getVerifiedActorSessionOrFail,
// //   getRoleByIdOrThrow,
// //   sanitizeUserSummary,
// // } from '../shared/access';

// export function registerUserIpcHandlers(database: AppDatabase): void {
//   ipcMain.handle('users:list-users', () => {
//     try {
//       const actor = getVerifiedActorSessionOrFail(database);
//       const users = database.users.listUsers().map((entry) => sanitizeUserSummary(actor, entry));
//       return { ok: true, users };
//     } catch (error) {
//       return { ok: false, error: error instanceof Error ? error.message : t.users.listFailed };
//     }
//   });

//   ipcMain.handle('users:list-deleted-users', () => {
//     try {
//       const actor = getVerifiedActorSessionOrFail(database);
//       if (!canViewInactiveUsers(actor)) {
//         return { ok: false, error: t.users.listInactiveDenied };
//       }
// }

// // /**
// //  * Registers all user-related IPC handlers for listing, creating, updating,
// //  * restoring, deleting, and inactivating users.
// //  *
// //  * @param database - Application database access object.
// //  * @returns Nothing.
// //  */
// // export function registerUserIpcHandlers(database: AppDatabase): void {
// //   /** Handles user list requests and returns actor-sanitized user summaries. */
// //   ipcMain.handle('users:list-users', () => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);
// //       const users = database.users.listUsers().map((entry) => sanitizeUserSummary(actor, entry));
// //       return { ok: true, users };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.listFailed };
// //     }
// //   });

// //   /** Handles inactive-user list requests when the actor has view privileges. */
// //   ipcMain.handle('users:list-inactive-users', () => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);
// //       if (!canViewInactiveUsers(actor)) {
// //         return { ok: false, error: t.users.listInactiveDenied };
// //       }

// //       const users = database.users.listInactiveUsers();
// //       return { ok: true, users };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.listInactiveFailed };
// //     }
// //   });

// //   /** Handles restore requests for inactive users the actor is allowed to manage. */
// //   ipcMain.handle('users:restore-user', (_event, payload: unknown) => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);
// //       if (!canRestoreUsers(actor)) {
// //         return { ok: false, error: t.users.restoreDenied };
// //       }

// //       const parsed = deleteUserSchema.safeParse(payload);
// //       if (!parsed.success) {
// //         return { ok: false, error: t.users.restorePayloadInvalid };
// //       }

// //       const target = database.users.findUserById(parsed.data.userId);
// //       if (!target) {
// //         return { ok: false, error: t.users.userNotFound };
// //       }

// //       if (target.is_active === 1) {
// //         return { ok: false, error: t.users.restoreTargetAlreadyActive };
// //       }

// //       if (!target.user_role_id || !canActorManageTarget(actor, target.user_role_id)) {
// //         return { ok: false, error: t.users.restoreTargetDenied };
// //       }

// //       database.users.restoreUser(parsed.data.userId);
// //       database.audit.createAuditLog({
// //         id: randomUUID(),
// //         userId: parsed.data.userId,
// //         entityType: 'user',
// //         entityId: parsed.data.userId,
// //         eventType: 'user_restored',
// //         actorUserId: actor.user.id,
// //         details: `User restored by ${actor.user.username}`,
// //       });

// //       return { ok: true };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.restoreFailed };
// //     }
// //   });

// //   /** Handles permanent deletion requests for inactive users within actor scope. */
// //   ipcMain.handle('users:hard-delete-user', (_event, payload: unknown) => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);
// //       if (!canRestoreUsers(actor)) {
// //         return { ok: false, error: t.users.hardDeleteDenied };
// //       }

// //       const parsed = deleteUserSchema.safeParse(payload);
// //       if (!parsed.success) {
// //         return { ok: false, error: t.users.hardDeletePayloadInvalid };
// //       }

// //       const target = database.users.findUserById(parsed.data.userId);
// //       if (!target) {
// //         return { ok: false, error: t.users.userNotFound };
// //       }

// //       if (target.is_active === 1) {
// //         return { ok: false, error: t.users.hardDeleteTargetMustBeInactive };
// //       }

// //       if (!target.user_role_id || !canActorManageTarget(actor, target.user_role_id)) {
// //         return { ok: false, error: t.users.hardDeleteTargetDenied };
// //       }

// //       database.audit.createAuditLog({
// //         id: randomUUID(),
// //         userId: parsed.data.userId,
// //         entityType: 'user',
// //         entityId: parsed.data.userId,
// //         eventType: 'user_hard_deleted',
// //         actorUserId: actor.user.id,
// //         details: `User ${target.username} permanently deleted by ${actor.user.username}`,
// //       });
      
// //       database.users.hardDeleteUser(parsed.data.userId);
// //       return { ok: true };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.hardDeleteFailed };
// //     }
// //   });

// //   /** Handles create-user requests with role-scope and single-admin safeguards. */
// //   ipcMain.handle('users:create-user', async (_event, payload: unknown) => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);

// //       const parsed = createUserSchema.safeParse(payload);
// //       if (!parsed.success) {
// //         return { ok: false, error: t.users.createPayloadInvalid };
// //       }

// //       const targetRole = getRoleByIdOrThrow(database, parsed.data.userRoleId);
// //       if (!canActorManageTarget(actor, targetRole.id)) {
// //         return { ok: false, error: t.users.createRoleDenied };
// //       }

// //       const adminRole = getAdminRoleOrThrow(database);
// //       if (targetRole.id === adminRole.id) {
// //         return { ok: false, error: t.users.singleAdminOnly };
// //       }

// //       const existing = database.users.findUserByUsername(parsed.data.username);
// //       if (existing) {
// //         return { ok: false, error: t.users.usernameExists };
// //       }

// //       const passwordHash = await hashPassword(parsed.data.password);
// //       database.users.createUser({
// //         id: randomUUID(),
// //         username: parsed.data.username,
// //         passwordHash,
// //         displayName: parsed.data.displayName,
// //         userRoleId: targetRole.id,
// //       });

// //       return { ok: true };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.createFailed };
// //     }
// //   });

// //   /** Handles update-user requests with actor/target role authorization checks. */
// //   ipcMain.handle('users:update-user', async (_event, payload: unknown) => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);
// //       if (!canModifyUsers(actor)) {
// //         return { ok: false, error: t.users.updateDenied };
// //       }

// //       const parsed = updateUserSchema.safeParse(payload);
// //       if (!parsed.success) {
// //         return { ok: false, error: t.users.updatePayloadInvalid };
// //       }

// //       if (parsed.data.userId === actor.user.id) {
// //         return { ok: false, error: t.users.updateSelfDenied };
// //       }

// //       const target = database.users.findUserById(parsed.data.userId);
// //       if (!target || target.is_active !== 1 || !target.user_role_id) {
// //         return { ok: false, error: t.users.userNotFound };
// //       }

// //       if (!canActorManageTarget(actor, target.user_role_id)) {
// //         return { ok: false, error: t.users.updateTargetDenied };
// //       }

// //       const nextRole = getRoleByIdOrThrow(database, parsed.data.userRoleId);
// //       if (!canActorManageTarget(actor, nextRole.id)) {
// //         return { ok: false, error: t.users.updateRoleDenied };
// //       }

// //       const normalizedUsername = parsed.data.username.trim().toLowerCase();
// //       const existing = database.users.findUserByUsername(normalizedUsername);
// //       if (existing && existing.id !== target.id) {
// //         return { ok: false, error: t.users.usernameExists };
// //       }

// //       const adminRole = getAdminRoleOrThrow(database);
// //       if (
// //         target.user_role_id !== adminRole.id &&
// //         nextRole.id === adminRole.id
// //       ) {
// //         return { ok: false, error: t.users.singleAdminOnly };
// //       }

// //       if (
// //         target.user_role_id === adminRole.id &&
// //         nextRole.id !== adminRole.id &&
// //         database.roles.countUsersByRole(adminRole.id) <= 1
// //       ) {
// //         return { ok: false, error: t.users.updateLastAdminDenied };
// //       }

// //       const nextPassword = parsed.data.password;
// //       const nextPasswordHash = nextPassword ? await hashPassword(nextPassword) : undefined;

// //       database.users.updateUser({
// //         userId: target.id,
// //         username: normalizedUsername,
// //         passwordHash: nextPasswordHash,
// //         displayName: parsed.data.displayName,
// //         userRoleId: nextRole.id,
// //       });

// //       database.audit.createAuditLog({
// //         id: randomUUID(),
// //         userId: target.id,
// //         entityType: 'user',
// //         entityId: target.id,
// //         eventType: 'user_updated',
// //         actorUserId: actor.user.id,
// //         details: `User ${target.username} updated by ${actor.user.username}`,
// //       });

// //       return { ok: true };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.updateFailed };
// //     }
// //   });

// //   /** Handles set-user-inactive requests with self-delete and last-admin guards. */
// //   ipcMain.handle('users:set-user-inactive', (_event, payload: unknown) => {
// //     try {
// //       const actor = getVerifiedActorSessionOrFail(database);

// //       const parsed = deleteUserSchema.safeParse(payload);
// //       if (!parsed.success) {
// //         return { ok: false, error: t.users.deletePayloadInvalid };
// //       }

// //       if (parsed.data.userId === actor.user.id) {
// //         return { ok: false, error: t.users.deleteSelfDenied };
// //       }

// //       const users = database.users.listUsers();
// //       const target = users.find((entry) => entry.id === parsed.data.userId);
// //       if (!target) {
// //         return { ok: false, error: t.users.userNotFound };
// //       }

// //       if (!canActorManageTarget(actor, target.user_role_id)) {
// //         return { ok: false, error: t.users.deleteTargetDenied };
// //       }

// //       const adminRole = getAdminRoleOrThrow(database);
// //       if (target.user_role_id === adminRole.id && database.roles.countUsersByRole(adminRole.id) <= 1) {
// //         return { ok: false, error: t.users.deleteLastAdminDenied };
// //       }

// //       database.users.setUserInactive(parsed.data.userId);
// //       database.audit.createAuditLog({
// //         id: randomUUID(),
// //         userId: parsed.data.userId,
// //         entityType: 'user',
// //         entityId: parsed.data.userId,
// //         eventType: 'user_marked_inactive',
// //         actorUserId: actor.user.id,
// //         details: `User ${target.username} marked inactive by ${actor.user.username}`,
// //       });

// //       return { ok: true };
// //     } catch (error) {
// //       return { ok: false, error: error instanceof Error ? error.message : t.users.deleteFailed };
// //     }
// //   });
// // }

