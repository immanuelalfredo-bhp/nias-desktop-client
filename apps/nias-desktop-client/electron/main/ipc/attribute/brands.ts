import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerBrandIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('brand:list-active', async (_event): Promise<Envelope<attribute.Brand[]>> => {
    try {
      const brands = userDb.brand.listActive();
      logger.info(
        { scope: 'brand', brandCount: brands.length },
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
          scope: 'brand',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
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
      const brands = userDb.brand.listDeleted();
      logger.info(
        { scope: 'brand', brandCount: brands.length },
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
          scope: 'brand',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
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
    'brand:get-by-id',
    async (_event, brandId: string): Promise<Envelope<attribute.Brand>> => {
      try {
        const brand = userDb.brand.getById(brandId);
        if (!brand) {
          logger.error({ scope: 'brand', brandId }, 'Brand not found');
          return {
            success: false,
            message: 'Brand not found',
          };
        }
        logger.info({ scope: 'brand', brandId }, 'Brand retrieved successfully');
        return {
          success: true,
          message: 'Brand retrieved successfully',
          data: brand,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            brandId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve brand',
        );
        return {
          success: false,
          message: 'Failed to retrieve brand',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:create',
    async (_event, payload: attribute.CreateBrandInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateBrandInputSchema.parse(payload);

        const data: attribute.CreateBrand = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          skuCode: parsed.skuCode,
          sortOrder: parsed.sortOrder,
        };

        userDb.brand.create(data);
        logger.info({ scope: 'brand', brandId: data.id }, 'Brand created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'brands',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', brandId: data.id }, 'Audit log created for brand creation');

        return {
          success: true,
          message: 'Brand created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create brand',
        );
        return {
          success: false,
          message: 'Failed to create brand',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:update',
    async (_event, payload: attribute.UpdateBrandInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateBrandInputSchema.parse(payload);
        const existing = userDb.brand.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'brand', brandId: parsed.id }, 'Brand not found for update');
          return {
            success: false,
            message: 'Brand not found for update',
          };
        }

        const updatedData: attribute.UpdateBrand = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          skuCode: parsed.skuCode,
          sortOrder: parsed.sortOrder,
        };

        userDb.brand.update(updatedData);
        logger.info({ scope: 'brand', brandId: parsed.id }, 'Brand updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'brands',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', brandId: parsed.id }, 'Audit log created for brand update');

        return {
          success: true,
          message: 'Brand updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update brand',
        );
        return {
          success: false,
          message: 'Failed to update brand',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:delete',
    async (_event, brandId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.brand.getById(brandId);
        if (!existing) {
          logger.error({ scope: 'brand', brandId }, 'Brand not found for deletion');
          return {
            success: false,
            message: 'Brand not found for deletion',
          };
        }
        userDb.brand.delete(brandId);
        logger.info({ scope: 'brand', brandId }, 'Brand deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'brands',
          recordName: existing.name,
          recordId: brandId,
        });
        logger.info({ scope: 'audit', brandId }, 'Audit log created for brand deletion');

        return {
          success: true,
          message: 'Brand deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            brandId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete brand',
        );
        return {
          success: false,
          message: 'Failed to delete brand',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:restore',
    async (_event, brandId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.brand.getById(brandId);
        if (!existing) {
          logger.error({ scope: 'brand', brandId }, 'Brand not found for restoration');
          return {
            success: false,
            message: 'Brand not found for restoration',
          };
        }
        userDb.brand.restore(brandId);
        logger.info({ scope: 'brand', brandId }, 'Brand restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'brands',
          recordName: existing.name,
          recordId: brandId,
        });
        logger.info({ scope: 'audit', brandId }, 'Audit log created for brand restoration');

        return {
          success: true,
          message: 'Brand restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            brandId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore brand',
        );
        return {
          success: false,
          message: 'Failed to restore brand',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:upsert',
    async (_event, payload: attribute.Brand[]): Promise<common.SuccessResponse> => {
      try {
        userDb.brand.transaction(() => {
          for (const brand of payload) {
            const parsed = attribute.BrandSchema.parse(brand);
            userDb.brand.upsert(parsed);
            logger.info({ scope: 'brand', brandId: parsed.id }, 'Brand upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'brands',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', brandId: parsed.id },
              'Audit log created for brand upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Brands upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert brands',
        );
        return {
          success: false,
          message: 'Failed to upsert brands',
        };
      }
    },
  );

  ipcMain.handle(
    'brand:get-by-item-id',
    async (_event, itemId: string): Promise<Envelope<attribute.Brand[]>> => {
      try {
        const brands = userDb.brand.getByItemId(itemId);
        logger.info({ scope: 'brand', itemId }, 'Brands retrieved by item ID successfully');
        if (!brands || brands.length === 0) {
          return {
            success: true,
            message: 'No brands found for the given item ID',
            data: [],
          };
        }
        return {
          success: true,
          message: 'Brands retrieved by item ID successfully',
          data: brands,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'brand',
            itemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve brands by item ID',
        );
        return {
          success: false,
          message: 'Failed to retrieve brands by item ID',
        };
      }
    },
  );
}
