import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerSystemMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('system-map:list-active', async (_event): Promise<Envelope<item.SystemMap[]>> => {
    try {
      const systemMaps = userDb.systemMap.listActive();
      logger.info(
        { scope: 'system-map', systemMapCount: systemMaps.length },
        'Active system maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Active system maps retrieved successfully',
        data: systemMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'system-map',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active system maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve active system maps',
      };
    }
  });

  ipcMain.handle('system-map:list-deleted', async (_event): Promise<Envelope<item.SystemMap[]>> => {
    try {
      const systemMaps = userDb.systemMap.listDeleted();
      logger.info(
        { scope: 'system-map', systemMapCount: systemMaps.length },
        'Deleted system maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted system maps retrieved successfully',
        data: systemMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'system-map',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted system maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted system maps',
      };
    }
  });

  ipcMain.handle(
    'system-map:get-by-id',
    async (_event, systemMapId: string): Promise<Envelope<item.SystemMap | null>> => {
      try {
        const systemMap = userDb.systemMap.getById(systemMapId);
        if (!systemMap) {
          logger.error({ scope: 'system-map', systemMapId }, 'System value not found');
          return {
            success: false,
            message: 'System value not found',
          };
        }
        logger.info({ scope: 'system-map', systemMapId }, 'System value retrieved successfully');
        return {
          success: true,
          message: 'System value retrieved successfully',
          data: systemMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            systemMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve system map',
        );
        return {
          success: false,
          message: 'Failed to retrieve system map',
        };
      }
    },
  );

  ipcMain.handle(
    'system-map:create',
    async (_event, payload: item.CreateSystemMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateSystemMapInputSchema.parse(payload);

        const data: item.CreateSystemMap = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          systemId: parsed.systemId,
        };

        userDb.systemMap.create(data);
        logger.info(
          { scope: 'system-map', systemMapId: data.id },
          'System map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'system_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', systemMapId: data.id },
          'Audit log created for system map creation',
        );

        return {
          success: true,
          message: 'System map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create system map',
        );
        return {
          success: false,
          message: 'Failed to create system map',
        };
      }
    },
  );

  ipcMain.handle(
    'system-map:update',
    async (_event, payload: item.UpdateSystemMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateSystemMapSchema.parse(payload);
        const existing = userDb.systemMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'system-map', systemMapId: parsed.id },
            'System map not found for update',
          );
          return {
            success: false,
            message: 'System map not found for update',
          };
        }

        const updatedData: item.UpdateSystemMap = {
          id: parsed.id,
          itemId: parsed.itemId,
          systemId: parsed.systemId,
        };

        userDb.systemMap.update(updatedData);
        logger.info(
          { scope: 'system-map', systemMapId: parsed.id },
          'System map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'system_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', systemMapId: parsed.id },
          'Audit log created for system map update',
        );

        return {
          success: true,
          message: 'System map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update system map',
        );
        return {
          success: false,
          message: 'Failed to update system map',
        };
      }
    },
  );

  ipcMain.handle(
    'system-map:delete',
    async (_event, systemMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.systemMap.getById(systemMapId);
        if (!existing) {
          logger.error({ scope: 'system-map', systemMapId }, 'System map not found for deletion');
          return {
            success: false,
            message: 'System map not found for deletion',
          };
        }
        userDb.systemMap.delete(systemMapId);
        logger.info({ scope: 'system-map', systemMapId }, 'System map deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'system_maps',
          recordName: existing.id,
          recordId: systemMapId,
        });
        logger.info({ scope: 'audit', systemMapId }, 'Audit log created for system map deletion');

        return {
          success: true,
          message: 'System map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            systemMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete system map',
        );
        return {
          success: false,
          message: 'Failed to delete system map',
        };
      }
    },
  );

  ipcMain.handle(
    'system-map:restore',
    async (_event, systemMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.systemMap.getById(systemMapId);
        if (!existing) {
          logger.error(
            { scope: 'system-map', systemMapId },
            'System map not found for restoration',
          );
          return {
            success: false,
            message: 'System map not found for restoration',
          };
        }
        userDb.systemMap.restore(systemMapId);
        logger.info({ scope: 'system-map', systemMapId }, 'System map restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'system_maps',
          recordName: existing.id,
          recordId: systemMapId,
        });
        logger.info(
          { scope: 'audit', systemMapId },
          'Audit log created for system map restoration',
        );

        return {
          success: true,
          message: 'System map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            systemMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore system map',
        );
        return {
          success: false,
          message: 'Failed to restore system map',
        };
      }
    },
  );

  ipcMain.handle(
    'system-map:upsert',
    async (_event, payload: item.SystemMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.systemMap.transaction(() => {
          for (const systemMap of payload) {
            const parsed = item.SystemMapSchema.parse(systemMap);
            userDb.systemMap.upsert(parsed);
            logger.info(
              { scope: 'system-map', systemMapId: parsed.id },
              'System map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'system_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', systemMapId: parsed.id },
              'Audit log created for system map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'System maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'system-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert system maps',
        );
        return {
          success: false,
          message: 'Failed to upsert system maps',
        };
      }
    },
  );
}
