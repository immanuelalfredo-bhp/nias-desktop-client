import { ipcMain } from 'electron';
import { variant, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerVendorPriceIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'vendor-price:list-active',
    async (_event): Promise<Envelope<variant.VendorPrice[]>> => {
      try {
        const vendorPrices = userDb.vendorPrice.listActive();
        logger.info(
          { scope: 'vendor-price', vendorPriceCount: vendorPrices.length },
          'Active vendor prices retrieved successfully',
        );
        return {
          success: true,
          message: 'Active vendor prices retrieved successfully',
          data: vendorPrices,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active vendor prices',
        );
        return {
          success: false,
          message: 'Failed to retrieve active vendor prices',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:list-deleted',
    async (_event): Promise<Envelope<variant.VendorPrice[]>> => {
      try {
        const vendorPrices = userDb.vendorPrice.listDeleted();
        logger.info(
          { scope: 'vendor-price', vendorPriceCount: vendorPrices.length },
          'Deleted vendor prices retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted vendor prices retrieved successfully',
          data: vendorPrices,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted vendor prices',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted vendor prices',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:get-by-id',
    async (_event, vendorPriceId: string): Promise<Envelope<variant.VendorPrice | null>> => {
      try {
        const vendorPrice = userDb.vendorPrice.getById(vendorPriceId);
        if (!vendorPrice) {
          logger.error({ scope: 'vendor-price', vendorPriceId }, 'Vendor price not found');
          return {
            success: false,
            message: 'Vendor price not found',
          };
        }
        logger.info(
          { scope: 'vendor-price', vendorPriceId },
          'Vendor price retrieved successfully',
        );
        return {
          success: true,
          message: 'Vendor price retrieved successfully',
          data: vendorPrice,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            vendorPriceId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve vendor price',
        );
        return {
          success: false,
          message: 'Failed to retrieve vendor price',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:create',
    async (_event, payload: variant.CreateVendorPriceInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.CreateVendorPriceInputSchema.parse(payload);

        const data: variant.CreateVendorPrice = {
          id: crypto.randomUUID(),
          vendorId: parsed.vendorId,
          variantId: parsed.variantId,
          originalPrice: parsed.originalPrice,
          discountedPrice: parsed.discountedPrice,
        };

        userDb.vendorPrice.create(data);
        logger.info(
          { scope: 'vendor-price', vendorPriceId: data.id },
          'Vendor price created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'vendor_prices',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', vendorPriceId: data.id },
          'Audit log created for vendor price creation',
        );

        return {
          success: true,
          message: 'Vendor price record created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create vendor price record',
        );
        return {
          success: false,
          message: 'Failed to create vendor price record',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:update',
    async (_event, payload: variant.UpdateVendorPrice): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.UpdateVendorPriceSchema.parse(payload);
        const existing = userDb.vendorPrice.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'vendor-price', vendorPriceId: parsed.id },
            'Vendor price not found for update',
          );
          return {
            success: false,
            message: 'Vendor price not found for update',
          };
        }

        const updatedData: variant.UpdateVendorPrice = {
          id: parsed.id,
          vendorId: parsed.vendorId,
          variantId: parsed.variantId,
          originalPrice: parsed.originalPrice,
          discountedPrice: parsed.discountedPrice,
        };

        userDb.vendorPrice.update(updatedData);
        logger.info(
          { scope: 'vendor-price', vendorPriceId: parsed.id },
          'Vendor price updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'vendor_prices',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', vendorPriceId: parsed.id },
          'Audit log created for vendor price update',
        );

        return {
          success: true,
          message: 'Vendor price updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update vendor price record',
        );
        return {
          success: false,
          message: 'Failed to update vendor price record',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:delete',
    async (_event, vendorPriceId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendorPrice.getById(vendorPriceId);
        if (!existing) {
          logger.error(
            { scope: 'vendor-price', vendorPriceId },
            'Vendor price not found for deletion',
          );
          return {
            success: false,
            message: 'Vendor price not found for deletion',
          };
        }
        userDb.vendorPrice.delete(vendorPriceId);
        logger.info({ scope: 'vendor-price', vendorPriceId }, 'Vendor price deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'vendor_prices',
          recordName: existing.id,
          recordId: existing.id,
        });
        logger.info(
          { scope: 'audit', vendorPriceId },
          'Audit log created for vendor price deletion',
        );

        return {
          success: true,
          message: 'Vendor price deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            vendorPriceId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete vendor price record',
        );
        return {
          success: false,
          message: 'Failed to delete vendor price record',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:restore',
    async (_event, vendorPriceId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendorPrice.getById(vendorPriceId);
        if (!existing) {
          logger.error(
            { scope: 'vendor-price', vendorPriceId },
            'Vendor price not found for restoration',
          );
          return {
            success: false,
            message: 'Vendor price not found for restoration',
          };
        }
        userDb.vendorPrice.restore(vendorPriceId);
        logger.info({ scope: 'vendor-price', vendorPriceId }, 'Vendor price restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'vendor_prices',
          recordName: existing.id,
          recordId: existing.id,
        });
        logger.info(
          { scope: 'audit', vendorPriceId },
          'Audit log created for vendor price restoration',
        );

        return {
          success: true,
          message: 'Vendor price restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            vendorPriceId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore vendor price record',
        );
        return {
          success: false,
          message: 'Failed to restore vendor price record',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor-price:upsert',
    async (_event, payload: variant.VendorPrice[]): Promise<common.SuccessResponse> => {
      try {
        userDb.vendorPrice.transaction(() => {
          for (const vendorPrice of payload) {
            const parsed = variant.VendorPriceSchema.parse(vendorPrice);
            userDb.vendorPrice.upsert(parsed);
            logger.info(
              { scope: 'vendor-price', vendorPriceId: parsed.id },
              'Vendor price upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'vendor_prices',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', vendorPriceId: parsed.id },
              'Audit log created for vendor price upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Vendor price records upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor-price',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert vendor price records',
        );
        return {
          success: false,
          message: 'Failed to upsert vendor price records',
        };
      }
    },
  );
}
