import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerRoleIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('role:list-active', async (_event): Promise<Envelope<system.Role[]>> => {
    try {
      const roles = userDb.role.listActive();
      logger.info(
        { scope: 'role', roleCount: roles.length },
        'Active roles retrieved successfully',
      );
      return {
        success: true,
        message: 'Active roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'role',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active roles',
      );
      return {
        success: false,
        message: 'Failed to retrieve active roles',
      };
    }
  });

  ipcMain.handle('role:list-deleted', async (_event): Promise<Envelope<system.Role[]>> => {
    try {
      const roles = userDb.role.listDeleted();
      logger.info(
        { scope: 'role', roleCount: roles.length },
        'Deleted roles retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'role',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted roles',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted roles',
      };
    }
  });

  ipcMain.handle(
    'role:get-by-id',
    async (_event, roleId: string): Promise<Envelope<system.Role | null>> => {
      try {
        const role = userDb.role.getById(roleId);
        if (!role) {
          logger.error({ scope: 'role', roleId }, 'Role not found');
          return {
            success: false,
            message: 'Role not found',
          };
        }
        logger.info({ scope: 'role', roleId }, 'Role retrieved successfully');
        return {
          success: true,
          message: 'Role retrieved successfully',
          data: role,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role',
            roleId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve role',
        );
        return {
          success: false,
          message: 'Failed to retrieve role',
        };
      }
    },
  );

  ipcMain.handle(
    'role:create',
    async (_event, payload: system.CreateRoleInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateRoleInputSchema.parse(payload);

        const data: system.CreateRole = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
        };

        userDb.role.create(data);
        logger.info({ scope: 'role', roleId: data.id }, 'Role created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'roles',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', roleId: data.id }, 'Audit log created for role creation');

        return {
          success: true,
          message: 'Role created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create role',
        );
        return {
          success: false,
          message: 'Failed to create role',
        };
      }
    },
  );

  ipcMain.handle(
    'role:update',
    async (_event, payload: system.UpdateRoleInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateRoleInputSchema.parse(payload);
        const existing = userDb.role.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'role', roleId: parsed.id }, 'Role not found for update');
          return {
            success: false,
            message: 'Role not found for update',
          };
        }

        const updatedData: system.UpdateRole = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
        };

        userDb.role.update(updatedData);
        logger.info({ scope: 'role', roleId: parsed.id }, 'Role updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'roles',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', roleId: parsed.id }, 'Audit log created for role update');

        return {
          success: true,
          message: 'Role updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update role',
        );
        return {
          success: false,
          message: 'Failed to update role',
        };
      }
    },
  );

  ipcMain.handle('role:delete', async (_event, roleId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.role.getById(roleId);
      if (!existing) {
        logger.error({ scope: 'role', roleId }, 'Role not found for deletion');
        return {
          success: false,
          message: 'Role not found for deletion',
        };
      }
      userDb.role.delete(roleId);
      logger.info({ scope: 'role', roleId }, 'Role deleted successfully');

      createAuditLog(userDb, userId, {
        action: 'delete',
        tableName: 'roles',
        recordName: existing.name,
        recordId: roleId,
      });
      logger.info({ scope: 'audit', roleId }, 'Audit log created for role deletion');

      return {
        success: true,
        message: 'Role deleted successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'role',
          roleId,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to delete role',
      );
      return {
        success: false,
        message: 'Failed to delete role',
      };
    }
  });

  ipcMain.handle(
    'role:restore',
    async (_event, roleId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.role.getById(roleId);
        if (!existing) {
          logger.error({ scope: 'role', roleId }, 'Role not found for restoration');
          return {
            success: false,
            message: 'Role not found for restoration',
          };
        }
        userDb.role.restore(roleId);
        logger.info({ scope: 'role', roleId }, 'Role restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'roles',
          recordName: existing.name,
          recordId: roleId,
        });
        logger.info({ scope: 'audit', roleId }, 'Audit log created for role restoration');

        return {
          success: true,
          message: 'Role restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role',
            roleId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore role',
        );
        return {
          success: false,
          message: 'Failed to restore role',
        };
      }
    },
  );

  ipcMain.handle(
    'role:upsert',
    async (_event, payload: system.Role[]): Promise<common.SuccessResponse> => {
      try {
        userDb.role.transaction(() => {
          for (const role of payload) {
            const parsed = system.RoleSchema.parse(role);
            userDb.role.upsert(parsed);
            logger.info({ scope: 'role', roleId: parsed.id }, 'Role upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'roles',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info({ scope: 'audit', roleId: parsed.id }, 'Audit log created for role upsert');
          }
        });
        return {
          success: true,
          message: 'Roles upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert roles',
        );
        return {
          success: false,
          message: 'Failed to upsert roles',
        };
      }
    },
  );
}
