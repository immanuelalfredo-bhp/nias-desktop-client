import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../../utils';

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
        const parsed = attribute.CreateBrandInputSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'brands',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid brand creation payload',
          );
          return { success: false, message: 'Invalid brand creation payload' };
        }

        const newBrand: attribute.CreateBrand = {
          id: crypto.randomUUID(),
          name: parsed.data.name,
          normalizedName: slugify(parsed.data.name),
          skuCode: parsed.data.skuCode,
        };
        userDb.brand.createBrand(newBrand);
        logger.info({ scope: 'brands', brandId: newBrand.id }, 'Brand created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'brands',
          recordId: newBrand.id,
          details: `Brand ${newBrand.name} created by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', brandId: newBrand.id },
          'Audit log created for brand creation',
        );

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
        // should be impossible to reach here without an id, but just in case
        if (!payload.id) {
          return { success: false, message: 'Brand id is required for updates' };
        }

        const parsed = attribute.UpdateBrandInputSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'brands',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid brand update payload',
          );
          return { success: false, message: 'Invalid brand update payload' };
        }

        const updatedBrand: attribute.UpdateBrand = {
          id: parsed.data.id,
          name: parsed.data.name,
          normalizedName: parsed.data.name ? slugify(parsed.data.name) : undefined,
          skuCode: parsed.data.skuCode,
        };
        userDb.brand.updateBrand(updatedBrand);
        logger.info({ scope: 'brands', brandId: updatedBrand.id }, 'Brand updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'brands',
          recordId: updatedBrand.id,
          details: `Brand ${updatedBrand.name} updated by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', brandId: updatedBrand.id },
          'Audit log created for brand update',
        );

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
        const parsed = attribute.BrandIdSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'brands',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid brand deletion payload',
          );
          return { success: false, message: 'Invalid brand deletion payload' };
        }

        userDb.brand.deleteBrand(parsed.data);
        logger.info({ scope: 'brands', brandId: parsed.data.id }, 'Brand deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'brands',
          recordId: parsed.data.id,
          details: `Brand ${parsed.data.id} deleted by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', brandId: parsed.data.id },
          'Audit log created for brand deletion',
        );

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
        const parsed = attribute.BrandIdSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'brands',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid brand restoration payload',
          );
          return { success: false, message: 'Invalid brand restoration payload' };
        }

        userDb.brand.restoreBrand(parsed.data);
        logger.info({ scope: 'brands', brandId: parsed.data.id }, 'Brand restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'brands',
          recordId: parsed.data.id,
          details: `Brand ${parsed.data.id} restored by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', brandId: parsed.data.id },
          'Audit log created for brand restoration',
        );

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
