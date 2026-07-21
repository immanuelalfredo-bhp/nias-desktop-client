import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerRoleCapabilitiesIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'role-capability:list-active',
    async (_event): Promise<Envelope<system.RoleCapability[]>> => {
      try {
        const roleCapabilities = userDb.roleCapability.listActive();
        logger.info(
          { scope: 'role-capability', roleCapabilityCount: roleCapabilities.length },
          'Active role capabilities retrieved successfully',
        );
        return {
          success: true,
          message: 'Active role capabilities retrieved successfully',
          data: roleCapabilities,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active role capabilities',
        );
        return {
          success: false,
          message: 'Failed to retrieve active role capabilities',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:list-deleted',
    async (_event): Promise<Envelope<system.RoleCapability[]>> => {
      try {
        const roleCapabilities = userDb.roleCapability.listDeleted();
        logger.info(
          { scope: 'role-capability', roleCapabilityCount: roleCapabilities.length },
          'Deleted role capabilities retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted role capabilities retrieved successfully',
          data: roleCapabilities,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted role capabilities',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted role capabilities',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:get-by-id',
    async (_event, roleCapabilityId: string): Promise<Envelope<system.RoleCapability | null>> => {
      try {
        const roleCapability = userDb.roleCapability.getById(roleCapabilityId);
        if (!roleCapability) {
          logger.error({ scope: 'role-capability', roleCapabilityId }, 'Role capability not found');
          return {
            success: false,
            message: 'Role capability not found',
          };
        }
        logger.info(
          { scope: 'role-capability', roleCapabilityId },
          'Role capability retrieved successfully',
        );
        return {
          success: true,
          message: 'Role capability retrieved successfully',
          data: roleCapability,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            roleCapabilityId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve role capability',
        );
        return {
          success: false,
          message: 'Failed to retrieve role capability',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:create',
    async (_event, payload: system.CreateRoleCapabilityInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateRoleCapabilityInputSchema.parse(payload);

        const data: system.CreateRoleCapability = {
          id: crypto.randomUUID(),
          roleId: parsed.roleId,
          capability: parsed.capability,
        };

        userDb.roleCapability.create(data);
        logger.info(
          { scope: 'role-capability', roleCapabilityId: data.id },
          'Role capability created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'role_capabilities',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', roleCapabilityId: data.id },
          'Audit log created for role capability creation',
        );

        return {
          success: true,
          message: 'Role capability created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create role capability',
        );
        return {
          success: false,
          message: 'Failed to create role capability',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:update',
    async (_event, payload: system.UpdateRoleCapability): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateRoleCapabilitySchema.parse(payload);
        const existing = userDb.roleCapability.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'role-capability', roleCapabilityId: parsed.id },
            'Role capability not found for update',
          );
          return {
            success: false,
            message: 'Role capability not found for update',
          };
        }

        const updatedData: system.UpdateRoleCapability = {
          id: parsed.id,
          roleId: parsed.roleId,
          capability: parsed.capability,
        };

        userDb.roleCapability.update(updatedData);
        logger.info(
          { scope: 'role-capability', roleCapabilityId: parsed.id },
          'Role capability updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'role_capabilities',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', roleCapabilityId: parsed.id },
          'Audit log created for role capability update',
        );

        return {
          success: true,
          message: 'Role capability updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update role capability',
        );
        return {
          success: false,
          message: 'Failed to update role capability',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:delete',
    async (_event, roleCapabilityId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleCapability.getById(roleCapabilityId);
        if (!existing) {
          logger.error(
            { scope: 'role-capability', roleCapabilityId },
            'Role capability not found for deletion',
          );
          return {
            success: false,
            message: 'Role capability not found for deletion',
          };
        }
        userDb.roleCapability.delete(roleCapabilityId);
        logger.info(
          { scope: 'role-capability', roleCapabilityId },
          'Role capability deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'role_capabilities',
          recordName: roleCapabilityId,
          recordId: roleCapabilityId,
        });
        logger.info(
          { scope: 'audit', roleCapabilityId },
          'Audit log created for role capability deletion',
        );

        return {
          success: true,
          message: 'Role capability deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            roleCapabilityId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete role capability',
        );
        return {
          success: false,
          message: 'Failed to delete role capability',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:restore',
    async (_event, roleCapabilityId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.roleCapability.getById(roleCapabilityId);
        if (!existing) {
          logger.error(
            { scope: 'role-capability', roleCapabilityId },
            'Role capability not found for restoration',
          );
          return {
            success: false,
            message: 'Role capability not found for restoration',
          };
        }
        userDb.roleCapability.restore(roleCapabilityId);
        logger.info(
          { scope: 'role-capability', roleCapabilityId },
          'Role capability restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'role_capabilities',
          recordName: roleCapabilityId,
          recordId: roleCapabilityId,
        });
        logger.info(
          { scope: 'audit', roleCapabilityId },
          'Audit log created for role capability restoration',
        );

        return {
          success: true,
          message: 'Role capability restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            roleCapabilityId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore role capability',
        );
        return {
          success: false,
          message: 'Failed to restore role capability',
        };
      }
    },
  );

  ipcMain.handle(
    'role-capability:upsert',
    async (_event, payload: system.RoleCapability[]): Promise<common.SuccessResponse> => {
      try {
        userDb.roleCapability.transaction(() => {
          for (const roleCapability of payload) {
            const parsed = system.RoleCapabilitySchema.parse(roleCapability);
            userDb.roleCapability.upsert(parsed);
            logger.info(
              { scope: 'role-capability', roleCapabilityId: parsed.id },
              'Role capability upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'role_capabilities',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', roleCapabilityId: parsed.id },
              'Audit log created for role capability upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Role capabilities upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'role-capability',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert role capabilities',
        );
        return {
          success: false,
          message: 'Failed to upsert role capabilities',
        };
      }
    },
  );
}
