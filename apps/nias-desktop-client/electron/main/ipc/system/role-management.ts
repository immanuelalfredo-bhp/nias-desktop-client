import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerRoleManagementIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'role-management:list-active',
    async (_event): Promise<Envelope<system.RoleManagement[]>> => {
      try {
        const roleManagement = userDb.roleManagement.listActive();
        logger.info(
          { scope: 'role-management', roleManagementCount: roleManagement.length },
          'Active role management map retrieved successfully',
        );
        return {
          success: true,
          message: 'Active role management map retrieved successfully',
          data: roleManagement,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active role management map',
        );
        return {
          success: false,
          message: 'Failed to retrieve active role management map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:list-deleted',
    async (_event): Promise<Envelope<system.RoleManagement[]>> => {
      try {
        const roleManagement = userDb.roleManagement.listDeleted();
        logger.info(
          { scope: 'role-management', roleManagementCount: roleManagement.length },
          'Deleted role management map retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted role management map retrieved successfully',
          data: roleManagement,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted role management map',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted role management map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:get-by-id',
    async (_event, roleManagementId: string): Promise<Envelope<system.RoleManagement | null>> => {
      try {
        const roleManagement = userDb.roleManagement.getById(roleManagementId);
        if (!roleManagement) {
          logger.error({ scope: 'role-management', roleManagementId }, 'Role management map not found');
          return {
            success: false,
            message: 'Role management map not found',
          };
        }
        logger.info(
          { scope: 'role-management', roleManagementId },
          'Role management map retrieved successfully',
        );
        return {
          success: true,
          message: 'Role management map retrieved successfully',
          data: roleManagement,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            roleManagementId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve role management map',
        );
        return {
          success: false,
          message: 'Failed to retrieve role management map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:create',
    async (_event, payload: system.CreateRoleManagementInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateRoleManagementInputSchema.parse(payload);

        const data: system.CreateRoleManagement = {
          id: crypto.randomUUID(),
          roleId: parsed.roleId,
          managedRoleId: parsed.managedRoleId,
        };

        userDb.roleManagement.create(data);
        logger.info(
          { scope: 'role-management', roleManagementId: data.id },
          'Role management created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'role_management',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', roleManagementId: data.id },
          'Audit log created for role management creation',
        );

        return {
          success: true,
          message: 'Role management created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create role management',
        );
        return {
          success: false,
          message: 'Failed to create role management',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:update',
    async (_event, payload: system.UpdateRoleManagement): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateRoleManagementSchema.parse(payload);
        const existing = userDb.roleManagement.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'role-management', roleManagementId: parsed.id },
            'Role management not found for update',
          );
          return {
            success: false,
            message: 'Role management not found for update',
          };
        }

        const updatedData: system.UpdateRoleManagement = {
          id: parsed.id,
          roleId: parsed.roleId,
          managedRoleId: parsed.managedRoleId,
        };

        userDb.roleManagement.update(updatedData);
        logger.info(
          { scope: 'role-management', roleManagementId: parsed.id },
          'Role management updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'role_management',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', roleManagementId: parsed.id },
          'Audit log created for role management update',
        );

        return {
          success: true,
          message: 'Role management updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update role management',
        );
        return {
          success: false,
          message: 'Failed to update role management',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:delete',
    async (_event, roleManagementId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleManagement.getById(roleManagementId);
        if (!existing) {
          logger.error(
            { scope: 'role-management', roleManagementId },
            'Role management not found for deletion',
          );
          return {
            success: false,
            message: 'Role management not found for deletion',
          };
        }
        userDb.roleManagement.delete(roleManagementId);
        logger.info(
          { scope: 'role-management', roleManagementId },
          'Role management deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'role_management',
          recordName: roleManagementId,
          recordId: roleManagementId,
        });
        logger.info(
          { scope: 'audit', roleManagementId },
          'Audit log created for role management deletion',
        );

        return {
          success: true,
          message: 'Role management deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            roleManagementId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete role management',
        );
        return {
          success: false,
          message: 'Failed to delete role management',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:restore',
    async (_event, roleManagementId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleManagement.getById(roleManagementId);
        if (!existing) {
          logger.error(
            { scope: 'role-management', roleManagementId },
            'Role management not found for restoration',
          );
          return {
            success: false,
            message: 'Role management not found for restoration',
          };
        }
        userDb.roleManagement.restore(roleManagementId);
        logger.info(
          { scope: 'role-management', roleManagementId },
          'Role management restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'role_management',
          recordName: roleManagementId,
          recordId: roleManagementId,
        });
        logger.info(
          { scope: 'audit', roleManagementId },
          'Audit log created for role management restoration',
        );

        return {
          success: true,
          message: 'Role management restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            roleManagementId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore role management',
        );
        return {
          success: false,
          message: 'Failed to restore role management',
        };
      }
    },
  );

  ipcMain.handle(
    'role-management:upsert',
    async (_event, payload: system.RoleManagement[]): Promise<common.SuccessResponse> => {
      try {
        userDb.roleManagement.transaction(() => {
          for (const roleManagement of payload) {
            const parsed = system.RoleManagementSchema.parse(roleManagement);
            userDb.roleManagement.upsert(parsed);
            logger.info(
              { scope: 'role-management', roleManagementId: parsed.id },
              'Role management upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'role_management',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', roleManagementId: parsed.id },
              'Audit log created for role management upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Role management upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-management',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert role management',
        );
        return {
          success: false,
          message: 'Failed to upsert role management',
        };
      }
    },
  );
}
