import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerRoleMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'role-map:list-active',
    async (_event): Promise<Envelope<system.RoleMap[]>> => {
      try {
        const roleMaps = userDb.roleMap.listActive();
        logger.info(
          { scope: 'role-map', roleMapCount: roleMaps.length },
          'Active role maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active role maps retrieved successfully',
          data: roleMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active role maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active role maps',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:list-deleted',
    async (_event): Promise<Envelope<system.RoleMap[]>> => {
      try {
        const roleMaps = userDb.roleMap.listDeleted();
        logger.info(
          { scope: 'role-map', roleMapCount: roleMaps.length },
          'Deleted role maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted role maps retrieved successfully',
          data: roleMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted role maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted role maps',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:get-by-id',
    async (_event, roleMapId: string): Promise<Envelope<system.RoleMap | null>> => {
      try {
        const roleMap = userDb.roleMap.getById(roleMapId);
        if (!roleMap) {
          logger.error({ scope: 'role-map', roleMapId }, 'Role map not found');
          return {
            success: false,
            message: 'Role map not found',
          };
        }
        logger.info(
          { scope: 'role-map', roleMapId },
          'Role map retrieved successfully',
        );
        return {
          success: true,
          message: 'Role map retrieved successfully',
          data: roleMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            roleMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve role map',
        );
        return {
          success: false,
          message: 'Failed to retrieve role map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:create',
    async (_event, payload: system.CreateRoleMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateRoleMapInputSchema.parse(payload);

        const data: system.CreateRoleMap = {
          id: crypto.randomUUID(),
          roleId: parsed.roleId,
          userId: parsed.userId,
        };

        userDb.roleMap.create(data);
        logger.info(
          { scope: 'role-map', roleMapId: data.id },
          'Role map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'role_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', roleMapId: data.id },
          'Audit log created for role map creation',
        );

        return {
          success: true,
          message: 'Role map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create role map',
        );
        return {
          success: false,
          message: 'Failed to create role map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:update',
    async (_event, payload: system.UpdateRoleMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateRoleMapSchema.parse(payload);
        const existing = userDb.roleMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'role-map', roleMapId: parsed.id },
            'Role map not found for update',
          );
          return {
            success: false,
            message: 'Role map not found for update',
          };
        }

        const updatedData: system.UpdateRoleMap = {
          id: parsed.id,
          roleId: parsed.roleId,
          userId: parsed.userId,
        };

        userDb.roleMap.update(updatedData);
        logger.info(
          { scope: 'role-map', roleMapId: parsed.id },
          'Role map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'role_maps',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', roleMapId: parsed.id },
          'Audit log created for role map update',
        );

        return {
          success: true,
          message: 'Role map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update role map',
        );
        return {
          success: false,
          message: 'Failed to update role map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:delete',
    async (_event, roleMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleMap.getById(roleMapId);
        if (!existing) {
          logger.error(
            { scope: 'role-map', roleMapId },
            'Role map not found for deletion',
          );
          return {
            success: false,
            message: 'Role map not found for deletion',
          };
        }
        userDb.roleMap.delete(roleMapId);
        logger.info(
          { scope: 'role-map', roleMapId },
          'Role map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'role_maps',
          recordName: roleMapId,
          recordId: roleMapId,
        });
        logger.info(
          { scope: 'audit', roleMapId },
          'Audit log created for role map deletion',
        );

        return {
          success: true,
          message: 'Role map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            roleMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete role map',
        );
        return {
          success: false,
          message: 'Failed to delete role map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:restore',
    async (_event, roleMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleMap.getById(roleMapId);
        if (!existing) {
          logger.error(
            { scope: 'role-map', roleMapId },
            'Role map not found for restoration',
          );
          return {
            success: false,
            message: 'Role map not found for restoration',
          };
        }
        userDb.roleMap.restore(roleMapId);
        logger.info(
          { scope: 'role-map', roleMapId },
          'Role map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'role_maps',
          recordName: roleMapId,
          recordId: roleMapId,
        });
        logger.info(
          { scope: 'audit', roleMapId },
          'Audit log created for role map restoration',
        );

        return {
          success: true,
          message: 'Role map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            roleMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore role map',
        );
        return {
          success: false,
          message: 'Failed to restore role map',
        };
      }
    },
  );

  ipcMain.handle(
    'role-map:upsert',
    async (_event, payload: system.RoleMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.roleMap.transaction(() => {
          for (const roleMap of payload) {
            const parsed = system.RoleMapSchema.parse(roleMap);
            userDb.roleMap.upsert(parsed);
            logger.info(
              { scope: 'role-map', roleMapId: parsed.id },
              'Role map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'role_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', roleMapId: parsed.id },
              'Audit log created for role map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Role maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert role maps',
        );
        return {
          success: false,
          message: 'Failed to upsert role maps',
        };
      }
    },
  );
}
