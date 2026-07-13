import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';

export function registerBrandIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('brand:list-active', async (_event): Promise<Envelope<attribute.Brand[]>> => {
    try {
      const brands = userDb.brand.listBrands();
      logger.info(
        { scope: 'brands', brandCount: brands.length },
        'Active brands retrieved successfully',
      );
      return {
        success: true,
        message: 'Active brands retrieved successfully',
        data: brands,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'brands',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active brands',
      );
      return {
        success: false,
        message: 'Failed to retrieve active brands',
      };
    }
  });

  ipcMain.handle('brand:list-deleted', async (_event): Promise<Envelope<attribute.Brand[]>> => {
    try {
      const brands = userDb.brand.listDeletedBrands();
      logger.info(
        { scope: 'brands', brandCount: brands.length },
        'Deleted brands retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted brands retrieved successfully',
        data: brands,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'brands',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted brands',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted brands',
      };
    }
  });

  ipcMain.handle(
    'brand:create',
    async (_event, payload: attribute.CreateBrandInput): Promise<common.SuccessResponse> => {
      try {
        const newBrand: attribute.Brand = {
          id: crypto.randomUUID(),
          name: payload.name,
          normalizedName: slugify(payload.name),
          skuCode: payload.skuCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          isSynced: false,
          syncVersion: 0,
        };
        userDb.brand.createBrand(newBrand);
        logger.info({ scope: 'brands', brandId: newBrand.id }, 'Brand created successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'create',
          tableName: 'brands',
          recordId: newBrand.id,
          timestamp: new Date().toISOString(),
          details: `Brand ${newBrand.name} created by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

        return { success: true, message: 'Brand created successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'brands',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create brand',
        );
        return { success: false, message: 'Failed to create brand' };
      }
    },
  );

  ipcMain.handle(
    'brand:update',
    async (_event, payload: attribute.UpdateBrandInput): Promise<common.SuccessResponse> => {
      try {
        const updatedBrand: attribute.UpdateBrand = {
          id: crypto.randomUUID(),
          name: payload.name,
          normalizedName: slugify(payload.name!),
          skuCode: payload.skuCode,
          updatedAt: new Date().toISOString(),
        };
        userDb.brand.updateBrand(updatedBrand);
        logger.info({ scope: 'brands', brandId: updatedBrand.id }, 'Brand updated successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'update',
          tableName: 'brands',
          recordId: updatedBrand.id!,
          timestamp: new Date().toISOString(),
          details: `Brand ${updatedBrand.name} updated by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

        return { success: true, message: 'Brand updated successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'brands',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update brand',
        );
        return { success: false, message: 'Failed to update brand' };
      }
    },
  );

  ipcMain.handle(
    'brand:delete',
    async (_event, payload: attribute.BrandId): Promise<common.SuccessResponse> => {
      try {
        userDb.brand.deleteBrand(payload);
        logger.info({ scope: 'brands', brandId: payload.id }, 'Brand deleted successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'delete',
          tableName: 'brands',
          recordId: payload.id,
          timestamp: new Date().toISOString(),
          details: `Brand ${payload.id} deleted by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

        return { success: true, message: 'Brand deleted successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'brands',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete brand',
        );
        return { success: false, message: 'Failed to delete brand' };
      }
    },
  );

  ipcMain.handle(
    'brand:restore',
    async (_event, payload: attribute.BrandId): Promise<common.SuccessResponse> => {
      try {
        userDb.brand.restoreBrand(payload);
        logger.info({ scope: 'brands', brandId: payload.id }, 'Brand restored successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'restore',
          tableName: 'brands',
          recordId: payload.id,
          timestamp: new Date().toISOString(),
          details: `Brand ${payload.id} restored by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

        return { success: true, message: 'Brand restored successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'brands',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore brand',
        );
        return { success: false, message: 'Failed to restore brand' };
      }
    },
  );
}
