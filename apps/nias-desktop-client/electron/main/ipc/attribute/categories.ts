import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerCategoryIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'category:list-active',
    async (_event): Promise<Envelope<attribute.Category[]>> => {
      try {
        const categories = userDb.category.listActive();
        logger.info(
          { scope: 'category', categoryCount: categories.length },
          'Active categories retrieved successfully',
        );
        return {
          success: true,
          message: 'Active categories retrieved successfully',
          data: categories,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active categories',
        );
        return {
          success: false,
          message: 'Failed to retrieve active categories',
        };
      }
    },
  );

  ipcMain.handle(
    'category:list-deleted',
    async (_event): Promise<Envelope<attribute.Category[]>> => {
      try {
        const categories = userDb.category.listDeleted();
        logger.info(
          { scope: 'category', categoryCount: categories.length },
          'Deleted categories retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted categories retrieved successfully',
          data: categories,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted categories',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted categories',
        };
      }
    },
  );

  ipcMain.handle(
    'category:get-by-id',
    async (_event, categoryId: string): Promise<Envelope<attribute.Category | null>> => {
      try {
        const category = userDb.category.getById(categoryId);
        if (!category) {
          logger.error({ scope: 'category', categoryId }, 'Category not found');
          return {
            success: false,
            message: 'Category not found',
          };
        }
        logger.info({ scope: 'category', categoryId }, 'Category retrieved successfully');
        return {
          success: true,
          message: 'Category retrieved successfully',
          data: category,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            categoryId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve category',
        );
        return {
          success: false,
          message: 'Failed to retrieve category',
        };
      }
    },
  );

  ipcMain.handle(
    'category:create',
    async (_event, payload: attribute.CreateCategoryInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateCategoryInputSchema.parse(payload);

        const data: attribute.CreateCategory = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          sortOrder: parsed.sortOrder,
        };

        userDb.category.create(data);
        logger.info({ scope: 'category', categoryId: data.id }, 'Category created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'categories',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info(
          { scope: 'audit', categoryId: data.id },
          'Audit log created for category creation',
        );

        return {
          success: true,
          message: 'Category created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create category',
        );
        return {
          success: false,
          message: 'Failed to create category',
        };
      }
    },
  );

  ipcMain.handle(
    'category:update',
    async (_event, payload: attribute.UpdateCategoryInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateCategoryInputSchema.parse(payload);
        const existing = userDb.category.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'category', categoryId: parsed.id },
            'Category not found for update',
          );
          return {
            success: false,
            message: 'Category not found for update',
          };
        }

        const updatedData: attribute.UpdateCategory = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          sortOrder: parsed.sortOrder,
        };

        userDb.category.update(updatedData);
        logger.info({ scope: 'category', categoryId: parsed.id }, 'Category updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'categories',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', categoryId: parsed.id },
          'Audit log created for category update',
        );

        return {
          success: true,
          message: 'Category updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update category',
        );
        return {
          success: false,
          message: 'Failed to update category',
        };
      }
    },
  );

  ipcMain.handle(
    'category:delete',
    async (_event, categoryId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.category.getById(categoryId);
        if (!existing) {
          logger.error({ scope: 'category', categoryId }, 'Category not found for deletion');
          return {
            success: false,
            message: 'Category not found for deletion',
          };
        }
        userDb.category.delete(categoryId);
        logger.info({ scope: 'category', categoryId }, 'Category deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'categories',
          recordName: existing.name,
          recordId: categoryId,
        });
        logger.info({ scope: 'audit', categoryId }, 'Audit log created for category deletion');

        return {
          success: true,
          message: 'Category deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            categoryId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete category',
        );
        return {
          success: false,
          message: 'Failed to delete category',
        };
      }
    },
  );

  ipcMain.handle(
    'category:restore',
    async (_event, categoryId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.category.getById(categoryId);
        if (!existing) {
          logger.error({ scope: 'category', categoryId }, 'Category not found for restoration');
          return {
            success: false,
            message: 'Category not found for restoration',
          };
        }
        userDb.category.restore(categoryId);
        logger.info({ scope: 'category', categoryId }, 'Category restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'categories',
          recordName: existing.name,
          recordId: categoryId,
        });
        logger.info({ scope: 'audit', categoryId }, 'Audit log created for category restoration');

        return {
          success: true,
          message: 'Category restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            categoryId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore category',
        );
        return {
          success: false,
          message: 'Failed to restore category',
        };
      }
    },
  );

  ipcMain.handle(
    'category:upsert',
    async (_event, payload: attribute.Category[]): Promise<common.SuccessResponse> => {
      try {
        userDb.category.transaction(() => {
          for (const category of payload) {
            const parsed = attribute.CategorySchema.parse(category);
            userDb.category.upsert(parsed);
            logger.info(
              { scope: 'category', categoryId: parsed.id },
              'Category upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'categories',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', categoryId: parsed.id },
              'Audit log created for category upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Categories upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'category',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert categories',
        );
        return {
          success: false,
          message: 'Failed to upsert categories',
        };
      }
    },
  );
}
