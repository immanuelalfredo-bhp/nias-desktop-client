import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerDimensionMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'dimension-map:list-active',
    async (_event): Promise<Envelope<item.DimensionMap[]>> => {
      try {
        const dimensionMaps = userDb.dimensionMap.listActive();
        logger.info(
          { scope: 'dimension-map', dimensionMapCount: dimensionMaps.length },
          'Active dimension maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active dimension maps retrieved successfully',
          data: dimensionMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active dimension maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active dimension maps',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:list-deleted',
    async (_event): Promise<Envelope<item.DimensionMap[]>> => {
      try {
        const dimensionMaps = userDb.dimensionMap.listDeleted();
        logger.info(
          { scope: 'dimension-map', dimensionMapCount: dimensionMaps.length },
          'Deleted dimension maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted dimension maps retrieved successfully',
          data: dimensionMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted dimension maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted dimension maps',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:get-by-id',
    async (_event, dimensionMapId: string): Promise<Envelope<item.DimensionMap | null>> => {
      try {
        const dimensionMap = userDb.dimensionMap.getById(dimensionMapId);
        if (!dimensionMap) {
          logger.error({ scope: 'dimension-map', dimensionMapId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'dimension-map', dimensionMapId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: dimensionMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            dimensionMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve dimension map',
        );
        return {
          success: false,
          message: 'Failed to retrieve dimension map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:create',
    async (_event, payload: item.CreateDimensionMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateDimensionMapInputSchema.parse(payload);

        const data: item.CreateDimensionMap = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          dimensionId: parsed.dimensionId,
        };

        userDb.dimensionMap.create(data);
        logger.info(
          { scope: 'dimension-map', dimensionMapId: data.id },
          'Dimension map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'dimension_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', dimensionMapId: data.id },
          'Audit log created for dimension map creation',
        );

        return {
          success: true,
          message: 'Dimension map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create dimension map',
        );
        return {
          success: false,
          message: 'Failed to create dimension map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:update',
    async (_event, payload: item.UpdateDimensionMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateDimensionMapSchema.parse(payload);
        const existing = userDb.dimensionMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'dimension-map', dimensionMapId: parsed.id },
            'Dimension map not found for update',
          );
          return {
            success: false,
            message: 'Dimension map not found for update',
          };
        }

        const updatedData: item.UpdateDimensionMap = {
          id: parsed.id,
          itemId: parsed.itemId,
          dimensionId: parsed.dimensionId,
        };

        userDb.dimensionMap.update(updatedData);
        logger.info(
          { scope: 'dimension-map', dimensionMapId: parsed.id },
          'Dimension map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'dimension_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', dimensionMapId: parsed.id },
          'Audit log created for dimension map update',
        );

        return {
          success: true,
          message: 'Dimension map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update dimension map',
        );
        return {
          success: false,
          message: 'Failed to update dimension map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:delete',
    async (_event, dimensionMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionMap.getById(dimensionMapId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-map', dimensionMapId },
            'Dimension map not found for deletion',
          );
          return {
            success: false,
            message: 'Dimension map not found for deletion',
          };
        }
        userDb.dimensionMap.delete(dimensionMapId);
        logger.info(
          { scope: 'dimension-map', dimensionMapId },
          'Dimension map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'dimension_maps',
          recordName: existing.id,
          recordId: dimensionMapId,
        });
        logger.info(
          { scope: 'audit', dimensionMapId },
          'Audit log created for dimension map deletion',
        );

        return {
          success: true,
          message: 'Dimension map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            dimensionMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete dimension map',
        );
        return {
          success: false,
          message: 'Failed to delete dimension map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:restore',
    async (_event, dimensionMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionMap.getById(dimensionMapId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-map', dimensionMapId },
            'Dimension map not found for restoration',
          );
          return {
            success: false,
            message: 'Dimension map not found for restoration',
          };
        }
        userDb.dimensionMap.restore(dimensionMapId);
        logger.info(
          { scope: 'dimension-map', dimensionMapId },
          'Dimension map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'dimension_maps',
          recordName: existing.id,
          recordId: dimensionMapId,
        });
        logger.info(
          { scope: 'audit', dimensionMapId },
          'Audit log created for dimension map restoration',
        );

        return {
          success: true,
          message: 'Dimension map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            dimensionMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore dimension map',
        );
        return {
          success: false,
          message: 'Failed to restore dimension map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-map:upsert',
    async (_event, payload: item.DimensionMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.dimensionMap.transaction(() => {
          for (const dimensionMap of payload) {
            const parsed = item.DimensionMapSchema.parse(dimensionMap);
            userDb.dimensionMap.upsert(parsed);
            logger.info(
              { scope: 'dimension-map', dimensionMapId: parsed.id },
              'Dimension map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'dimension_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', dimensionMapId: parsed.id },
              'Audit log created for dimension map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Dimension maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert dimension maps',
        );
        return {
          success: false,
          message: 'Failed to upsert dimension maps',
        };
      }
    },
  );
}
