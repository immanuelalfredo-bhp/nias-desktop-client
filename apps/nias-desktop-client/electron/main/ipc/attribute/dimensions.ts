import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerDimensionsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'dimension:list-active',
    async (_event): Promise<Envelope<attribute.Dimension[]>> => {
      try {
        const dimensions = userDb.dimension.listActive();
        logger.info(
          { scope: 'dimension', dimensionCount: dimensions.length },
          'Active dimensions retrieved successfully',
        );
        return {
          success: true,
          message: 'Active dimensions retrieved successfully',
          data: dimensions,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active dimensions',
        );
        return {
          success: false,
          message: 'Failed to retrieve active dimensions',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:list-deleted',
    async (_event): Promise<Envelope<attribute.Dimension[]>> => {
      try {
        const dimensions = userDb.dimension.listDeleted();
        logger.info(
          { scope: 'dimension', dimensionCount: dimensions.length },
          'Deleted dimensions retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted dimensions retrieved successfully',
          data: dimensions,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted dimensions',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted dimensions',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:get-by-id',
    async (_event, dimensionId: string): Promise<Envelope<attribute.Dimension | null>> => {
      try {
        const dimension = userDb.dimension.getById(dimensionId);
        if (!dimension) {
          logger.error({ scope: 'dimension', dimensionId }, 'Dimension not found');
          return {
            success: false,
            message: 'Dimension not found',
          };
        }
        logger.info({ scope: 'dimension', dimensionId }, 'Dimension retrieved successfully');
        return {
          success: true,
          message: 'Dimension retrieved successfully',
          data: dimension,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            dimensionId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve dimension',
        );
        return {
          success: false,
          message: 'Failed to retrieve dimension',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:create',
    async (_event, payload: attribute.CreateDimensionInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateDimensionInputSchema.parse(payload);

        const data: attribute.CreateDimension = {
          id: crypto.randomUUID(),
          scope: parsed.scope,
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          formName: parsed.formName,
          position: parsed.position,
          sortOrder: parsed.sortOrder,
        };

        userDb.dimension.create(data);
        logger.info({ scope: 'dimension', dimensionId: data.id }, 'Dimension created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'dimensions',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info(
          { scope: 'audit', dimensionId: data.id },
          'Audit log created for dimension creation',
        );

        return {
          success: true,
          message: 'Dimension created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create dimension',
        );
        return {
          success: false,
          message: 'Failed to create dimension',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:update',
    async (_event, payload: attribute.UpdateDimensionInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateDimensionInputSchema.parse(payload);
        const existing = userDb.dimension.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'dimension', dimensionId: parsed.id },
            'Dimension not found for update',
          );
          return {
            success: false,
            message: 'Dimension not found for update',
          };
        }

        const updatedData: attribute.UpdateDimension = {
          id: parsed.id,
          scope: parsed.scope,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          formName: parsed.formName,
          position: parsed.position,
          sortOrder: parsed.sortOrder,
        };

        userDb.dimension.update(updatedData);
        logger.info(
          { scope: 'dimension', dimensionId: parsed.id },
          'Dimension updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'dimensions',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', dimensionId: parsed.id },
          'Audit log created for dimension update',
        );

        return {
          success: true,
          message: 'Dimension updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update dimension',
        );
        return {
          success: false,
          message: 'Failed to update dimension',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:delete',
    async (_event, dimensionId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimension.getById(dimensionId);
        if (!existing) {
          logger.error({ scope: 'dimension', dimensionId }, 'Dimension not found for deletion');
          return {
            success: false,
            message: 'Dimension not found for deletion',
          };
        }
        userDb.dimension.delete(dimensionId);
        logger.info({ scope: 'dimension', dimensionId }, 'Dimension deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'dimensions',
          recordName: existing.name,
          recordId: dimensionId,
        });
        logger.info({ scope: 'audit', dimensionId }, 'Audit log created for dimension deletion');

        return {
          success: true,
          message: 'Dimension deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            dimensionId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete dimension',
        );
        return {
          success: false,
          message: 'Failed to delete dimension',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:restore',
    async (_event, dimensionId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimension.getById(dimensionId);
        if (!existing) {
          logger.error({ scope: 'dimension', dimensionId }, 'Dimension not found for restoration');
          return {
            success: false,
            message: 'Dimension not found for restoration',
          };
        }
        userDb.dimension.restore(dimensionId);
        logger.info({ scope: 'dimension', dimensionId }, 'Dimension restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'dimensions',
          recordName: existing.name,
          recordId: dimensionId,
        });
        logger.info({ scope: 'audit', dimensionId }, 'Audit log created for dimension restoration');

        return {
          success: true,
          message: 'Dimension restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            dimensionId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore dimension',
        );
        return {
          success: false,
          message: 'Failed to restore dimension',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension:upsert',
    async (_event, payload: attribute.Dimension[]): Promise<common.SuccessResponse> => {
      try {
        userDb.dimension.transaction(() => {
          for (const dimension of payload) {
            const parsed = attribute.DimensionSchema.parse(dimension);
            userDb.dimension.upsert(parsed);
            logger.info(
              { scope: 'dimension', dimensionId: parsed.id },
              'Dimension upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'dimensions',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', dimensionId: parsed.id },
              'Audit log created for dimension upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Dimensions upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert dimensions',
        );
        return {
          success: false,
          message: 'Failed to upsert dimensions',
        };
      }
    },
  );
}
