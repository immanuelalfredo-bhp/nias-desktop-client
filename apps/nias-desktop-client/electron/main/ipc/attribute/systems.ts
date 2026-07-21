import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerSystemIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('system:list-active', async (_event): Promise<Envelope<attribute.System[]>> => {
    try {
      const systems = userDb.system.listActive();
      logger.info(
        { scope: 'system', systemCount: systems.length },
        'Active systems retrieved successfully',
      );
      return {
        success: true,
        message: 'Active systems retrieved successfully',
        data: systems,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'system',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active systems',
      );
      return {
        success: false,
        message: 'Failed to retrieve active systems',
      };
    }
  });

  ipcMain.handle('system:list-deleted', async (_event): Promise<Envelope<attribute.System[]>> => {
    try {
      const systems = userDb.system.listDeleted();
      logger.info(
        { scope: 'system', systemCount: systems.length },
        'Deleted systems retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted systems retrieved successfully',
        data: systems,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'system',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted systems',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted systems',
      };
    }
  });

  ipcMain.handle(
    'system:get-by-id',
    async (_event, systemId: string): Promise<Envelope<attribute.System | null>> => {
      try {
        const system = userDb.system.getById(systemId);
        if (!system) {
          logger.error({ scope: 'system', systemId }, 'System not found');
          return {
            success: false,
            message: 'System not found',
          };
        }
        logger.info({ scope: 'system', systemId }, 'System retrieved successfully');
        return {
          success: true,
          message: 'System retrieved successfully',
          data: system,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            systemId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve system',
        );
        return {
          success: false,
          message: 'Failed to retrieve system',
        };
      }
    },
  );

  ipcMain.handle(
    'system:create',
    async (_event, payload: attribute.CreateSystemInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateSystemInputSchema.parse(payload);

        const data: attribute.CreateSystem = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          sortOrder: parsed.sortOrder,
        };

        userDb.system.create(data);
        logger.info({ scope: 'system', systemId: data.id }, 'System created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'systems',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', systemId: data.id }, 'Audit log created for system creation');

        return {
          success: true,
          message: 'System created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create system',
        );
        return {
          success: false,
          message: 'Failed to create system',
        };
      }
    },
  );

  ipcMain.handle(
    'system:update',
    async (_event, payload: attribute.UpdateSystemInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateSystemInputSchema.parse(payload);
        const existing = userDb.system.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'system', systemId: parsed.id }, 'System not found for update');
          return {
            success: false,
            message: 'System not found for update',
          };
        }

        const updatedData: attribute.UpdateSystem = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          sortOrder: parsed.sortOrder,
        };

        userDb.system.update(updatedData);
        logger.info({ scope: 'system', systemId: parsed.id }, 'System updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'systems',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', systemId: parsed.id }, 'Audit log created for system update');

        return {
          success: true,
          message: 'System updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update system',
        );
        return {
          success: false,
          message: 'Failed to update system',
        };
      }
    },
  );

  ipcMain.handle(
    'system:delete',
    async (_event, systemId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.system.getById(systemId);
        if (!existing) {
          logger.error({ scope: 'system', systemId }, 'System not found for deletion');
          return {
            success: false,
            message: 'System not found for deletion',
          };
        }
        userDb.system.delete(systemId);
        logger.info({ scope: 'system', systemId }, 'System deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'systems',
          recordName: existing.name,
          recordId: systemId,
        });
        logger.info({ scope: 'audit', systemId }, 'Audit log created for system deletion');

        return {
          success: true,
          message: 'System deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            systemId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete system',
        );
        return {
          success: false,
          message: 'Failed to delete system',
        };
      }
    },
  );

  ipcMain.handle(
    'system:restore',
    async (_event, systemId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.system.getById(systemId);
        if (!existing) {
          logger.error({ scope: 'system', systemId }, 'System not found for restoration');
          return {
            success: false,
            message: 'System not found for restoration',
          };
        }
        userDb.system.restore(systemId);
        logger.info({ scope: 'system', systemId }, 'System restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'systems',
          recordName: existing.name,
          recordId: systemId,
        });
        logger.info({ scope: 'audit', systemId }, 'Audit log created for system restoration');

        return {
          success: true,
          message: 'System restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            systemId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore system',
        );
        return {
          success: false,
          message: 'Failed to restore system',
        };
      }
    },
  );

  ipcMain.handle(
    'system:upsert',
    async (_event, payload: attribute.System[]): Promise<common.SuccessResponse> => {
      try {
        userDb.system.transaction(() => {
          for (const system of payload) {
            const parsed = attribute.SystemSchema.parse(system);
            userDb.system.upsert(parsed);
            logger.info({ scope: 'system', systemId: parsed.id }, 'System upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'systems',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', systemId: parsed.id },
              'Audit log created for system upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Systems upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert systems',
        );
        return {
          success: false,
          message: 'Failed to upsert systems',
        };
      }
    },
  );
}
