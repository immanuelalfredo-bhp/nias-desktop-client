import { ipcMain } from 'electron';
import { variant, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerVariantRecordsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'variant-record:list-active',
    async (_event): Promise<Envelope<variant.VariantRecord[]>> => {
      try {
        const variantRecords = userDb.variant.listActive();
        logger.info(
          { scope: 'variant-record', variantRecordCount: variantRecords.length },
          'Active variant records retrieved successfully',
        );
        return {
          success: true,
          message: 'Active variant records retrieved successfully',
          data: variantRecords,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active variant records',
        );
        return {
          success: false,
          message: 'Failed to retrieve active variant records',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:list-deleted',
    async (_event): Promise<Envelope<variant.VariantRecord[]>> => {
      try {
        const variantRecords = userDb.variant.listDeleted();
        logger.info(
          { scope: 'variant-record', variantRecordCount: variantRecords.length },
          'Deleted variant records retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted variant records retrieved successfully',
          data: variantRecords,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted variant records',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted variant records',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:get-by-id',
    async (_event, variantRecordId: string): Promise<Envelope<variant.VariantRecord | null>> => {
      try {
        const variantRecord = userDb.variant.getById(variantRecordId);
        if (!variantRecord) {
          logger.error({ scope: 'variant-record', variantRecordId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'variant-record', variantRecordId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: variantRecord,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            variantRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve variant record',
        );
        return {
          success: false,
          message: 'Failed to retrieve variant record',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:create',
    async (_event, payload: variant.CreateVariantRecordInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.CreateVariantRecordInputSchema.parse(payload);

        const data: variant.CreateVariantRecord = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          modeId: parsed.modeId,
          brandId: parsed.brandId,
          categoryId: parsed.categoryId,
          uomId: parsed.uomId,
          dimensionValueIds: parsed.dimensionValueIds,
          description: parsed.description,
          skuCode: parsed.skuCode,
          details: parsed.details,
        };

        userDb.variant.create(data);
        logger.info(
          { scope: 'variant-record', variantRecordId: data.id },
          'Variant record created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'variant_records',
          recordId: data.id,
          recordName: data.description,
        });
        logger.info(
          { scope: 'audit', variantRecordId: data.id },
          'Audit log created for variant record creation',
        );

        return {
          success: true,
          message: 'Variant record created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create variant record',
        );
        return {
          success: false,
          message: 'Failed to create variant record',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:update',
    async (_event, payload: variant.UpdateVariantRecord): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.UpdateVariantRecordSchema.parse(payload);
        const existing = userDb.variant.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'variant-record', variantRecordId: parsed.id },
            'Variant record not found for update',
          );
          return {
            success: false,
            message: 'Variant record not found for update',
          };
        }

        const updatedData: variant.UpdateVariantRecord = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          modeId: parsed.modeId,
          brandId: parsed.brandId,
          categoryId: parsed.categoryId,
          uomId: parsed.uomId,
          dimensionValueIds: parsed.dimensionValueIds,
          description: parsed.description,
          skuCode: parsed.skuCode,
          details: parsed.details,
        };

        userDb.variant.update(updatedData);
        logger.info(
          { scope: 'variant-record', variantRecordId: parsed.id },
          'Variant record updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'variant_records',
          recordName: parsed.description || existing.description,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', variantRecordId: parsed.id },
          'Audit log created for variant record update',
        );

        return {
          success: true,
          message: 'Variant record updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update variant record',
        );
        return {
          success: false,
          message: 'Failed to update variant record',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:delete',
    async (_event, variantRecordId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.variant.getById(variantRecordId);
        if (!existing) {
          logger.error(
            { scope: 'variant-record', variantRecordId },
            'Variant record not found for deletion',
          );
          return {
            success: false,
            message: 'Variant record not found for deletion',
          };
        }
        userDb.variant.delete(variantRecordId);
        logger.info(
          { scope: 'variant-record', variantRecordId },
          'Variant record deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'variant_records',
          recordName: existing.description,
          recordId: variantRecordId,
        });
        logger.info(
          { scope: 'audit', variantRecordId },
          'Audit log created for variant record deletion',
        );

        return {
          success: true,
          message: 'Variant record deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            variantRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete variant record',
        );
        return {
          success: false,
          message: 'Failed to delete variant record',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:restore',
    async (_event, variantRecordId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.variant.getById(variantRecordId);
        if (!existing) {
          logger.error(
            { scope: 'variant-record', variantRecordId },
            'Variant record not found for restoration',
          );
          return {
            success: false,
            message: 'Variant record not found for restoration',
          };
        }
        userDb.variant.restore(variantRecordId);
        logger.info(
          { scope: 'variant-record', variantRecordId },
          'Variant record restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'variant_records',
          recordName: existing.description,
          recordId: variantRecordId,
        });
        logger.info(
          { scope: 'audit', variantRecordId },
          'Audit log created for variant record restoration',
        );

        return {
          success: true,
          message: 'Variant record restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            variantRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore variant record',
        );
        return {
          success: false,
          message: 'Failed to restore variant record',
        };
      }
    },
  );

  ipcMain.handle(
    'variant-record:upsert',
    async (_event, payload: variant.VariantRecord[]): Promise<common.SuccessResponse> => {
      try {
        userDb.variant.transaction(() => {
          for (const variantRecord of payload) {
            const parsed = variant.VariantRecordSchema.parse(variantRecord);
            userDb.variant.upsert(parsed);
            logger.info(
              { scope: 'variant-record', variantRecordId: parsed.id },
              'Variant record upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'variant_records',
              recordName: parsed.description,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', variantRecordId: parsed.id },
              'Audit log created for variant record upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Variant records upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'variant-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert variant records',
        );
        return {
          success: false,
          message: 'Failed to upsert variant records',
        };
      }
    },
  );
}
