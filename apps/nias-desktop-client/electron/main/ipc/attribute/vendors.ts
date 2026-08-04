import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerVendorIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('vendor:list-active', async (_event): Promise<Envelope<attribute.Vendor[]>> => {
    try {
      const vendors = userDb.vendor.listActive();
      logger.info(
        { scope: 'vendor', vendorCount: vendors.length },
        'Active vendors retrieved successfully',
      );
      return {
        success: true,
        message: 'Active vendors retrieved successfully',
        data: vendors,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'vendor',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active vendors',
      );
      return {
        success: false,
        message: 'Failed to retrieve active vendors',
      };
    }
  });

  ipcMain.handle('vendor:list-deleted', async (_event): Promise<Envelope<attribute.Vendor[]>> => {
    try {
      const vendors = userDb.vendor.listDeleted();
      logger.info(
        { scope: 'vendor', vendorCount: vendors.length },
        'Deleted vendors retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted vendors retrieved successfully',
        data: vendors,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'vendor',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted vendors',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted vendors',
      };
    }
  });

  ipcMain.handle(
    'vendor:get-by-id',
    async (_event, vendorId: string): Promise<Envelope<attribute.Vendor>> => {
      try {
        const vendor = userDb.vendor.getById(vendorId);
        if (!vendor) {
          logger.error({ scope: 'vendor', vendorId }, 'Vendor not found');
          return {
            success: false,
            message: 'Vendor not found',
          };
        }
        logger.info({ scope: 'vendor', vendorId }, 'Vendor retrieved successfully');
        return {
          success: true,
          message: 'Vendor retrieved successfully',
          data: vendor,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            vendorId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve vendor',
        );
        return {
          success: false,
          message: 'Failed to retrieve vendor',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor:create',
    async (_event, payload: attribute.CreateVendorInput): Promise<Envelope<attribute.VendorId>> => {
      try {
        const parsed = attribute.CreateVendorInputSchema.parse(payload);

        const data: attribute.CreateVendor = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          skuCode: parsed.skuCode,
          sortOrder: parsed.sortOrder,
        };

        userDb.vendor.create(data);
        logger.info({ scope: 'vendor', vendorId: data.id }, 'Vendor created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'vendors',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', vendorId: data.id }, 'Audit log created for vendor creation');

        return {
          success: true,
          message: 'Vendor created successfully',
          data: { id: data.id },
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create vendor',
        );
        return {
          success: false,
          message: 'Failed to create vendor',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor:update',
    async (_event, payload: attribute.UpdateVendorInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateVendorInputSchema.parse(payload);
        const existing = userDb.vendor.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'vendor', vendorId: parsed.id }, 'Vendor not found for update');
          return {
            success: false,
            message: 'Vendor not found for update',
          };
        }

        const updatedData: attribute.UpdateVendor = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          skuCode: parsed.skuCode,
          sortOrder: parsed.sortOrder,
        };

        userDb.vendor.update(updatedData);
        logger.info({ scope: 'vendor', vendorId: parsed.id }, 'Vendor updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'vendors',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', vendorId: parsed.id }, 'Audit log created for vendor update');

        return {
          success: true,
          message: 'Vendor updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update vendor',
        );
        return {
          success: false,
          message: 'Failed to update vendor',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor:delete',
    async (_event, vendorId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendor.getById(vendorId);
        if (!existing) {
          logger.error({ scope: 'vendor', vendorId }, 'Vendor not found for deletion');
          return {
            success: false,
            message: 'Vendor not found for deletion',
          };
        }
        userDb.vendor.delete(vendorId);
        logger.info({ scope: 'vendor', vendorId }, 'Vendor deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'vendors',
          recordName: existing.name,
          recordId: vendorId,
        });
        logger.info({ scope: 'audit', vendorId }, 'Audit log created for vendor deletion');

        return {
          success: true,
          message: 'Vendor deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            vendorId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete vendor',
        );
        return {
          success: false,
          message: 'Failed to delete vendor',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor:restore',
    async (_event, vendorId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.vendor.getById(vendorId);
        if (!existing) {
          logger.error({ scope: 'vendor', vendorId }, 'Vendor not found for restoration');
          return {
            success: false,
            message: 'Vendor not found for restoration',
          };
        }
        userDb.vendor.restore(vendorId);
        logger.info({ scope: 'vendor', vendorId }, 'Vendor restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'vendors',
          recordName: existing.name,
          recordId: vendorId,
        });
        logger.info({ scope: 'audit', vendorId }, 'Audit log created for vendor restoration');

        return {
          success: true,
          message: 'Vendor restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            vendorId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore vendor',
        );
        return {
          success: false,
          message: 'Failed to restore vendor',
        };
      }
    },
  );

  ipcMain.handle(
    'vendor:upsert',
    async (_event, payload: attribute.Vendor[]): Promise<common.SuccessResponse> => {
      try {
        userDb.vendor.transaction(() => {
          for (const vendor of payload) {
            const parsed = attribute.VendorSchema.parse(vendor);
            userDb.vendor.upsert(parsed);
            logger.info({ scope: 'vendor', vendorId: parsed.id }, 'Vendor upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'vendors',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', vendorId: parsed.id },
              'Audit log created for vendor upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Vendors upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'vendor',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert vendors',
        );
        return {
          success: false,
          message: 'Failed to upsert vendors',
        };
      }
    },
  );
}
