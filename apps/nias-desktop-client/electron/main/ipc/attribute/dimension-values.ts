import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerDimensionValuesIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'dimension-value:list-active',
    async (_event): Promise<Envelope<attribute.DimensionValue[]>> => {
      try {
        const dimensionValues = userDb.dimensionValue.listActive();
        logger.info(
          { scope: 'dimension-value', dimensionValueCount: dimensionValues.length },
          'Active dimension values retrieved successfully',
        );
        return {
          success: true,
          message: 'Active dimension values retrieved successfully',
          data: dimensionValues,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active dimension values',
        );
        return {
          success: false,
          message: 'Failed to retrieve active dimension values',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:list-deleted',
    async (_event): Promise<Envelope<attribute.DimensionValue[]>> => {
      try {
        const dimensionValues = userDb.dimensionValue.listDeleted();
        logger.info(
          { scope: 'dimension-value', dimensionValueCount: dimensionValues.length },
          'Deleted dimension values retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted dimension values retrieved successfully',
          data: dimensionValues,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted dimension values',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted dimension values',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:get-by-id',
    async (
      _event,
      dimensionValueId: string,
    ): Promise<Envelope<attribute.DimensionValue | null>> => {
      try {
        const dimensionValue = userDb.dimensionValue.getById(dimensionValueId);
        if (!dimensionValue) {
          logger.error({ scope: 'dimension-value', dimensionValueId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'dimension-value', dimensionValueId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: dimensionValue,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            dimensionValueId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve dimension value',
        );
        return {
          success: false,
          message: 'Failed to retrieve dimension value',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:create',
    async (
      _event,
      payload: attribute.CreateDimensionValueInput,
    ): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateDimensionValueInputSchema.parse(payload);

        const data: attribute.CreateDimensionValue = {
          id: crypto.randomUUID(),
          dimensionId: parsed.dimensionId,
          name: parsed.name,
          skuCode: parsed.skuCode,
          numericValue: parsed.numericValue,
          sortOrder: parsed.sortOrder,
        };

        userDb.dimensionValue.create(data);
        logger.info(
          { scope: 'dimension-value', dimensionValueId: data.id },
          'Dimension value created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'dimension_values',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info(
          { scope: 'audit', dimensionValueId: data.id },
          'Audit log created for dimension value creation',
        );

        return {
          success: true,
          message: 'Dimension value created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create dimension value',
        );
        return {
          success: false,
          message: 'Failed to create dimension value',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:update',
    async (_event, payload: attribute.UpdateDimensionValue): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateDimensionValueSchema.parse(payload);
        const existing = userDb.dimensionValue.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value', dimensionValueId: parsed.id },
            'Dimension value not found for update',
          );
          return {
            success: false,
            message: 'Dimension value not found for update',
          };
        }

        const updatedData: attribute.UpdateDimensionValue = {
          id: parsed.id,
          dimensionId: parsed.dimensionId,
          name: parsed.name,
          skuCode: parsed.skuCode,
          numericValue: parsed.numericValue,
          sortOrder: parsed.sortOrder,
        };

        userDb.dimensionValue.update(updatedData);
        logger.info(
          { scope: 'dimension-value', dimensionValueId: parsed.id },
          'Dimension value updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'dimension_values',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', dimensionValueId: parsed.id },
          'Audit log created for dimension value update',
        );

        return {
          success: true,
          message: 'Dimension value updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update dimension value',
        );
        return {
          success: false,
          message: 'Failed to update dimension value',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:delete',
    async (_event, dimensionValueId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionValue.getById(dimensionValueId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value', dimensionValueId },
            'Dimension value not found for deletion',
          );
          return {
            success: false,
            message: 'Dimension value not found for deletion',
          };
        }
        userDb.dimensionValue.delete(dimensionValueId);
        logger.info(
          { scope: 'dimension-value', dimensionValueId },
          'Dimension value deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'dimension_values',
          recordName: existing.name,
          recordId: dimensionValueId,
        });
        logger.info(
          { scope: 'audit', dimensionValueId },
          'Audit log created for dimension value deletion',
        );

        return {
          success: true,
          message: 'Dimension value deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            dimensionValueId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete dimension value',
        );
        return {
          success: false,
          message: 'Failed to delete dimension value',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:restore',
    async (_event, dimensionValueId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.dimensionValue.getById(dimensionValueId);
        if (!existing) {
          logger.error(
            { scope: 'dimension-value', dimensionValueId },
            'Dimension value not found for restoration',
          );
          return {
            success: false,
            message: 'Dimension value not found for restoration',
          };
        }
        userDb.dimensionValue.restore(dimensionValueId);
        logger.info(
          { scope: 'dimension-value', dimensionValueId },
          'Dimension value restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'dimension_values',
          recordName: existing.name,
          recordId: dimensionValueId,
        });
        logger.info(
          { scope: 'audit', dimensionValueId },
          'Audit log created for dimension value restoration',
        );

        return {
          success: true,
          message: 'Dimension value restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            dimensionValueId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore dimension value',
        );
        return {
          success: false,
          message: 'Failed to restore dimension value',
        };
      }
    },
  );

  ipcMain.handle(
    'dimension-value:upsert',
    async (_event, payload: attribute.DimensionValue[]): Promise<common.SuccessResponse> => {
      try {
        userDb.dimensionValue.transaction(() => {
          for (const dimensionValue of payload) {
            const parsed = attribute.DimensionValueSchema.parse(dimensionValue);
            userDb.dimensionValue.upsert(parsed);
            logger.info(
              { scope: 'dimension-value', dimensionValueId: parsed.id },
              'Dimension value upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'dimension_values',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', dimensionValueId: parsed.id },
              'Audit log created for dimension value upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Dimension values upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'dimension-value',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert dimension values',
        );
        return {
          success: false,
          message: 'Failed to upsert dimension values',
        };
      }
    },
  );
}
