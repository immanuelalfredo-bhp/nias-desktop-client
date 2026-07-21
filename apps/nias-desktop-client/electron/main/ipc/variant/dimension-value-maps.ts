import { ipcMain } from 'electron';
import { variant, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerDimensionValueMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'dimension-value-map:list-active',
    async (_event): Promise<Envelope<variant.DimensionValueMap[]>> => {
      try {
        const dimensionValueMaps = userDb.dimensionValueMap.listActive();
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapCount: dimensionValueMaps.length },
          'Active dimension value maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active dimension value maps retrieved successfully',
          data: dimensionValueMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active dimension value maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active dimension value maps',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:list-deleted',
    async (_event): Promise<Envelope<variant.DimensionValueMap[]>> => {
      try {
        const dimensionValueMaps = userDb.dimensionValueMap.listDeleted();
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapCount: dimensionValueMaps.length },
          'Deleted dimension value maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted dimension value maps retrieved successfully',
          data: dimensionValueMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted dimension value maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted dimension value maps',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:get-by-id',
    async (
      _event,
      dimensionValueMapId: string,
    ): Promise<Envelope<variant.DimensionValueMap | null>> => {
      try {
        const dimensionValueMap = userDb.dimensionValueMap.getById(dimensionValueMapId);
        if (!dimensionValueMap) {
          logger.error(
            { scope: 'dimension-value-map', dimensionValueMapId },
            'Dimension value map not found',
          );
          return {
            success: false,
            message: 'Dimension value map not found',
          };
        }
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapId },
          'Dimension value map retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value map retrieved successfully',
          data: dimensionValueMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            dimensionValueMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve dimension value map',
        );
        return {
          success: false,
          message: 'Failed to retrieve dimension value map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:create',
    async (
      _event,
      payload: variant.CreateDimensionValueMapInput,
    ): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.CreateDimensionValueMapInputSchema.parse(payload);

        const data: variant.CreateDimensionValueMap = {
          id: crypto.randomUUID(),
          variantId: parsed.variantId,
          dimensionValueId: parsed.dimensionValueId,
        };

        userDb.dimensionValueMap.create(data);
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapId: data.id },
          'Dimension value map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'dimension_value_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', dimensionValueMapId: data.id },
          'Audit log created for dimension value map creation',
        );

        return {
          success: true,
          message: 'Dimension value map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create dimension value map',
        );
        return {
          success: false,
          message: 'Failed to create dimension value map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:update',
    async (_event, payload: variant.UpdateDimensionValueMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.UpdateDimensionValueMapSchema.parse(payload);
        const existing = userDb.dimensionValueMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value-map', dimensionValueMapId: parsed.id },
            'Dimension value map not found for update',
          );
          return {
            success: false,
            message: 'Dimension value map not found for update',
          };
        }

        const updatedData: variant.UpdateDimensionValueMap = {
          id: parsed.id,
          variantId: parsed.variantId,
          dimensionValueId: parsed.dimensionValueId,
        };

        userDb.dimensionValueMap.update(updatedData);
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapId: parsed.id },
          'Dimension value map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'dimension_value_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', dimensionValueMapId: parsed.id },
          'Audit log created for dimension value map update',
        );

        return {
          success: true,
          message: 'Dimension value map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update dimension value map',
        );
        return {
          success: false,
          message: 'Failed to update dimension value map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:delete',
    async (_event, dimensionValueMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionValueMap.getById(dimensionValueMapId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value-map', dimensionValueMapId },
            'Dimension value map not found for deletion',
          );
          return {
            success: false,
            message: 'Dimension value map not found for deletion',
          };
        }
        userDb.dimensionValueMap.delete(dimensionValueMapId);
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapId },
          'Dimension value map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'dimension_value_maps',
          recordName: existing.id,
          recordId: dimensionValueMapId,
        });
        logger.info(
          { scope: 'audit', dimensionValueMapId },
          'Audit log created for dimension value map deletion',
        );

        return {
          success: true,
          message: 'Dimension value map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            dimensionValueMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete dimension value map',
        );
        return {
          success: false,
          message: 'Failed to delete dimension value map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:restore',
    async (_event, dimensionValueMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionValueMap.getById(dimensionValueMapId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value-map', dimensionValueMapId },
            'Dimension value map not found for restoration',
          );
          return {
            success: false,
            message: 'Dimension value map not found for restoration',
          };
        }
        userDb.dimensionValueMap.restore(dimensionValueMapId);
        logger.info(
          { scope: 'dimension-value-map', dimensionValueMapId },
          'Dimension value map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'dimension_value_maps',
          recordName: existing.id,
          recordId: dimensionValueMapId,
        });
        logger.info(
          { scope: 'audit', dimensionValueMapId },
          'Audit log created for dimension value map restoration',
        );

        return {
          success: true,
          message: 'Dimension value map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            dimensionValueMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore dimension value map',
        );
        return {
          success: false,
          message: 'Failed to restore dimension value map',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value-map:upsert',
    async (_event, payload: variant.DimensionValueMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.dimensionValueMap.transaction(() => {
          for (const dimensionValueMap of payload) {
            const parsed = variant.DimensionValueMapSchema.parse(dimensionValueMap);
            userDb.dimensionValueMap.upsert(parsed);
            logger.info(
              { scope: 'dimension-value-map', dimensionValueMapId: parsed.id },
              'Dimension value map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'dimension_value_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', dimensionValueMapId: parsed.id },
              'Audit log created for dimension value map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Dimension value maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert dimension value maps',
        );
        return {
          success: false,
          message: 'Failed to upsert dimension value maps',
        };
      }
    },
  );
}
