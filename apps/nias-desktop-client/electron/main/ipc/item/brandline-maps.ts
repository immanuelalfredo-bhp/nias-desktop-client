import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerBrandlineMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'brandline-map:list-active',
    async (_event): Promise<Envelope<item.BrandlineMap[]>> => {
      try {
        const brandlineMaps = userDb.brandlineMap.listActive();
        logger.info(
          { scope: 'brandline-map', brandlineMapCount: brandlineMaps.length },
          'Active brandline maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active brandline maps retrieved successfully',
          data: brandlineMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active brandline maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active brandline maps',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:list-deleted',
    async (_event): Promise<Envelope<item.BrandlineMap[]>> => {
      try {
        const brandlineMaps = userDb.brandlineMap.listDeleted();
        logger.info(
          { scope: 'brandline-map', brandlineMapCount: brandlineMaps.length },
          'Deleted brandline maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted brandline maps retrieved successfully',
          data: brandlineMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted brandline maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted brandline maps',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:get-by-id',
    async (_event, brandlineMapId: string): Promise<Envelope<item.BrandlineMap | null>> => {
      try {
        const brandlineMap = userDb.brandlineMap.getById(brandlineMapId);
        if (!brandlineMap) {
          logger.error({ scope: 'brandline-map', brandlineMapId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'brandline-map', brandlineMapId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: brandlineMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            brandlineMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve brandline map',
        );
        return {
          success: false,
          message: 'Failed to retrieve brandline map',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:create',
    async (_event, payload: item.CreateBrandlineMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateBrandlineMapInputSchema.parse(payload);

        const data: item.CreateBrandlineMap = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          brandId: parsed.brandId,
        };

        userDb.brandlineMap.create(data);
        logger.info(
          { scope: 'brandline-map', brandlineMapId: data.id },
          'Brandline map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'brandline_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', brandlineMapId: data.id },
          'Audit log created for brandline map creation',
        );

        return {
          success: true,
          message: 'Brandline map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create brandline map',
        );
        return {
          success: false,
          message: 'Failed to create brandline map',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:update',
    async (_event, payload: item.UpdateBrandlineMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateBrandlineMapSchema.parse(payload);
        const existing = userDb.brandlineMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'brandline-map', brandlineMapId: parsed.id },
            'Brandline map not found for update',
          );
          return {
            success: false,
            message: 'Brandline map not found for update',
          };
        }

        const updatedData: item.UpdateBrandlineMap = {
          id: parsed.id,
          itemId: parsed.itemId,
          brandId: parsed.brandId,
        };

        userDb.brandlineMap.update(updatedData);
        logger.info(
          { scope: 'brandline-map', brandlineMapId: parsed.id },
          'Brandline map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'brandline_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', brandlineMapId: parsed.id },
          'Audit log created for brandline map update',
        );

        return {
          success: true,
          message: 'Brandline map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update brandline map',
        );
        return {
          success: false,
          message: 'Failed to update brandline map',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:delete',
    async (_event, brandlineMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.brandlineMap.getById(brandlineMapId);
        if (!existing) {
          logger.error(
            { scope: 'brandline-map', brandlineMapId },
            'Brandline map not found for deletion',
          );
          return {
            success: false,
            message: 'Brandline map not found for deletion',
          };
        }
        userDb.brandlineMap.delete(brandlineMapId);
        logger.info(
          { scope: 'brandline-map', brandlineMapId },
          'Brandline map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'brandline_maps',
          recordName: existing.id,
          recordId: brandlineMapId,
        });
        logger.info(
          { scope: 'audit', brandlineMapId },
          'Audit log created for brandline map deletion',
        );

        return {
          success: true,
          message: 'Brandline map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            brandlineMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete brandline map',
        );
        return {
          success: false,
          message: 'Failed to delete brandline map',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:restore',
    async (_event, brandlineMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.brandlineMap.getById(brandlineMapId);
        if (!existing) {
          logger.error(
            { scope: 'brandline-map', brandlineMapId },
            'Brandline map not found for restoration',
          );
          return {
            success: false,
            message: 'Brandline map not found for restoration',
          };
        }
        userDb.brandlineMap.restore(brandlineMapId);
        logger.info(
          { scope: 'brandline-map', brandlineMapId },
          'Brandline map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'brandline_maps',
          recordName: existing.id,
          recordId: brandlineMapId,
        });
        logger.info(
          { scope: 'audit', brandlineMapId },
          'Audit log created for brandline map restoration',
        );

        return {
          success: true,
          message: 'Brandline map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            brandlineMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore brandline map',
        );
        return {
          success: false,
          message: 'Failed to restore brandline map',
        };
      }
    },
  );

  ipcMain.handle(
    'brandline-map:upsert',
    async (_event, payload: item.BrandlineMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.brandlineMap.transaction(() => {
          for (const brandlineMap of payload) {
            const parsed = item.BrandlineMapSchema.parse(brandlineMap);
            userDb.brandlineMap.upsert(parsed);
            logger.info(
              { scope: 'brandline-map', brandlineMapId: parsed.id },
              'Brandline map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'brandline_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', brandlineMapId: parsed.id },
              'Audit log created for brandline map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Brandline maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brandline-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert brandline maps',
        );
        return {
          success: false,
          message: 'Failed to upsert brandline maps',
        };
      }
    },
  );
}
