import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerVendorMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('vendor-map:list-active', async (_event): Promise<Envelope<attribute.VendorMap[]>> => {
    try {
      const vendorMaps = userDb.vendorMap.listActive();
      logger.info(
        { scope: 'vendor-map', vendorMapCount: vendorMaps.length },
        'Active vendor maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Active vendor maps retrieved successfully',
        data: vendorMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'vendor-map',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active vendor maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve active vendor maps',
      };
    }
  });

  ipcMain.handle('vendor-map:list-deleted', async (_event): Promise<Envelope<attribute.VendorMap[]>> => {
    try {
      const vendorMaps = userDb.vendorMap.listDeleted();
      logger.info(
        { scope: 'vendor-map', vendorMapCount: vendorMaps.length },
        'Deleted vendor maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted vendor maps retrieved successfully',
        data: vendorMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'vendor-map',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted vendor maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted vendor maps',
      };
    }
  });

  ipcMain.handle(
    'vendor-map:get-by-id',
    async (_event, vendorMapId: string): Promise<Envelope<attribute.VendorMap | null>> => {
      try {
        const vendorMap = userDb.vendorMap.getById(vendorMapId);
        if (!vendorMap) {
          logger.error({ scope: 'vendor-map', vendorMapId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info({ scope: 'vendor-map', vendorMapId }, 'Dimension value retrieved successfully');
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: vendorMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            vendorMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve vendor map',
        );
        return {
          success: false,
          message: 'Failed to retrieve vendor map',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-map:create',
    async (_event, payload: attribute.CreateVendorMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateVendorMapInputSchema.parse(payload);

        const data: attribute.CreateVendorMap = {
          id: crypto.randomUUID(),
          brandId: parsed.brandId,
          vendorId: parsed.vendorId,
        };

        userDb.vendorMap.create(data);
        logger.info(
          { scope: 'vendor-map', vendorMapId: data.id },
          'Vendor map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'vendor_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', vendorMapId: data.id },
          'Audit log created for vendor map creation',
        );

        return {
          success: true,
          message: 'Vendor map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create vendor map',
        );
        return {
          success: false,
          message: 'Failed to create vendor map',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-map:update',
    async (_event, payload: attribute.UpdateVendorMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateVendorMapSchema.parse(payload);
        const existing = userDb.vendorMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'vendor-map', vendorMapId: parsed.id },
            'Vendor map not found for update',
          );
          return {
            success: false,
            message: 'Vendor map not found for update',
          };
        }

        const updatedData: attribute.UpdateVendorMap = {
          id: parsed.id,
          brandId: parsed.brandId,
          vendorId: parsed.vendorId,
        };

        userDb.vendorMap.update(updatedData);
        logger.info(
          { scope: 'vendor-map', vendorMapId: parsed.id },
          'Vendor map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'vendor_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', vendorMapId: parsed.id },
          'Audit log created for vendor map update',
        );

        return {
          success: true,
          message: 'Vendor map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update vendor map',
        );
        return {
          success: false,
          message: 'Failed to update vendor map',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-map:delete',
    async (_event, vendorMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendorMap.getById(vendorMapId);
        if (!existing) {
          logger.error({ scope: 'vendor-map', vendorMapId }, 'Vendor map not found for deletion');
          return {
            success: false,
            message: 'Vendor map not found for deletion',
          };
        }
        userDb.vendorMap.delete(vendorMapId);
        logger.info({ scope: 'vendor-map', vendorMapId }, 'Vendor map deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'vendor_maps',
          recordName: existing.id,
          recordId: vendorMapId,
        });
        logger.info({ scope: 'audit', vendorMapId }, 'Audit log created for vendor map deletion');

        return {
          success: true,
          message: 'Vendor map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            vendorMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete vendor map',
        );
        return {
          success: false,
          message: 'Failed to delete vendor map',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-map:restore',
    async (_event, vendorMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendorMap.getById(vendorMapId);
        if (!existing) {
          logger.error(
            { scope: 'vendor-map', vendorMapId },
            'Vendor map not found for restoration',
          );
          return {
            success: false,
            message: 'Vendor map not found for restoration',
          };
        }
        userDb.vendorMap.restore(vendorMapId);
        logger.info({ scope: 'vendor-map', vendorMapId }, 'Vendor map restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'vendor_maps',
          recordName: existing.id,
          recordId: vendorMapId,
        });
        logger.info(
          { scope: 'audit', vendorMapId },
          'Audit log created for vendor map restoration',
        );

        return {
          success: true,
          message: 'Vendor map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            vendorMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore vendor map',
        );
        return {
          success: false,
          message: 'Failed to restore vendor map',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-map:upsert',
    async (_event, payload: attribute.VendorMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.vendorMap.transaction(() => {
          for (const vendorMap of payload) {
            const parsed = attribute.VendorMapSchema.parse(vendorMap);
            userDb.vendorMap.upsert(parsed);
            logger.info(
              { scope: 'vendor-map', vendorMapId: parsed.id },
              'Vendor map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'vendor_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', vendorMapId: parsed.id },
              'Audit log created for vendor map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Vendor maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert vendor maps',
        );
        return {
          success: false,
          message: 'Failed to upsert vendor maps',
        };
      }
    },
  );
}
