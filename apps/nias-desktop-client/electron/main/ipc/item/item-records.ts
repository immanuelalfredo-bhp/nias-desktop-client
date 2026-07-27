import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerItemsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'item:list-active',
    async (_event): Promise<Envelope<item.ItemRecord[]>> => {
      try {
        const itemRecords = userDb.item.listActive();
        logger.info(
          { scope: 'item-record', itemRecordCount: itemRecords.length },
          'Active item records retrieved successfully',
        );
        return {
          success: true,
          message: 'Active item records retrieved successfully',
          data: itemRecords,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active item records',
        );
        return {
          success: false,
          message: 'Failed to retrieve active item records',
        };
      }
    },
  );

  ipcMain.handle(
    'item:list-deleted',
    async (_event): Promise<Envelope<item.ItemRecord[]>> => {
      try {
        const itemRecords = userDb.item.listDeleted();
        logger.info(
          { scope: 'item-record', itemRecordCount: itemRecords.length },
          'Deleted item records retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted item records retrieved successfully',
          data: itemRecords,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted item records',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted item records',
        };
      }
    },
  );

  ipcMain.handle(
    'item:get-by-id',
    async (_event, itemRecordId: string): Promise<Envelope<item.ItemRecord | null>> => {
      try {
        const itemRecord = userDb.item.getById(itemRecordId);
        if (!itemRecord) {
          logger.error({ scope: 'item-record', itemRecordId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'item-record', itemRecordId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: itemRecord,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            itemRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve item record',
        );
        return {
          success: false,
          message: 'Failed to retrieve item record',
        };
      }
    },
  );

  ipcMain.handle(
    'item:create',
    async (_event, payload: item.CreateItemRecordInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateItemRecordInputSchema.parse(payload);

        const data: item.CreateItemRecord = {
          id: crypto.randomUUID(),
          baseName: parsed.baseName,
          normalizedBaseName: slugify(parsed.baseName)!,
          displayName: parsed.displayName,
          normalizedDisplayName: slugify(parsed.displayName)!,
          skuSource: parsed.skuSource,
          skuCode: parsed.skuCode,
          materialType: parsed.materialType,
          materialClass: parsed.materialClass,
          creationSource: parsed.creationSource,
          delimiterType: parsed.delimiterType,
          hasAutoAssemblyTrigger: parsed.hasAutoAssemblyTrigger,
          imageUrl: parsed.imageUrl,
        };

        userDb.item.create(data);
        logger.info(
          { scope: 'item-record', itemRecordId: data.id },
          'Item record created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'item_records',
          recordId: data.id,
          recordName: data.displayName,
        });
        logger.info(
          { scope: 'audit', itemRecordId: data.id },
          'Audit log created for item record creation',
        );

        return {
          success: true,
          message: 'Item record created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create item record',
        );
        return {
          success: false,
          message: 'Failed to create item record',
        };
      }
    },
  );

  ipcMain.handle(
    'item:update',
    async (_event, payload: item.UpdateItemRecord): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateItemRecordSchema.parse(payload);
        const existing = userDb.item.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'item-record', itemRecordId: parsed.id },
            'Item record not found for update',
          );
          return {
            success: false,
            message: 'Item record not found for update',
          };
        }

        const updatedData: item.UpdateItemRecord = {
          id: parsed.id,
          baseName: parsed.baseName,
          normalizedBaseName: slugify(parsed.baseName),
          displayName: parsed.displayName,
          normalizedDisplayName: slugify(parsed.displayName),
          skuSource: parsed.skuSource,
          skuCode: parsed.skuCode,
          materialType: parsed.materialType,
          materialClass: parsed.materialClass,
          creationSource: parsed.creationSource,
          delimiterType: parsed.delimiterType,
          hasAutoAssemblyTrigger: parsed.hasAutoAssemblyTrigger,
          imageUrl: parsed.imageUrl,
        };

        userDb.item.update(updatedData);
        logger.info(
          { scope: 'item-record', itemRecordId: parsed.id },
          'Item record updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'item_records',
          recordName: parsed.displayName || existing.displayName,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', itemRecordId: parsed.id },
          'Audit log created for item record update',
        );

        return {
          success: true,
          message: 'Item record updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update item record',
        );
        return {
          success: false,
          message: 'Failed to update item record',
        };
      }
    },
  );

  ipcMain.handle(
    'item:delete',
    async (_event, itemRecordId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.item.getById(itemRecordId);
        if (!existing) {
          logger.error(
            { scope: 'item-record', itemRecordId },
            'Item record not found for deletion',
          );
          return {
            success: false,
            message: 'Item record not found for deletion',
          };
        }
        userDb.item.delete(itemRecordId);
        logger.info({ scope: 'item-record', itemRecordId }, 'Item record deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'item_records',
          recordName: existing.displayName,
          recordId: itemRecordId,
        });
        logger.info({ scope: 'audit', itemRecordId }, 'Audit log created for item record deletion');

        return {
          success: true,
          message: 'Item record deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            itemRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete item record',
        );
        return {
          success: false,
          message: 'Failed to delete item record',
        };
      }
    },
  );

  ipcMain.handle(
    'item:restore',
    async (_event, itemRecordId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.item.getById(itemRecordId);
        if (!existing) {
          logger.error(
            { scope: 'item-record', itemRecordId },
            'Item record not found for restoration',
          );
          return {
            success: false,
            message: 'Item record not found for restoration',
          };
        }
        userDb.item.restore(itemRecordId);
        logger.info({ scope: 'item-record', itemRecordId }, 'Item record restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'item_records',
          recordName: existing.displayName,
          recordId: itemRecordId,
        });
        logger.info(
          { scope: 'audit', itemRecordId },
          'Audit log created for item record restoration',
        );

        return {
          success: true,
          message: 'Item record restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            itemRecordId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore item record',
        );
        return {
          success: false,
          message: 'Failed to restore item record',
        };
      }
    },
  );

  ipcMain.handle(
    'item:upsert',
    async (_event, payload: item.ItemRecord[]): Promise<common.SuccessResponse> => {
      try {
        userDb.item.transaction(() => {
          for (const itemRecord of payload) {
            const parsed = item.ItemRecordSchema.parse(itemRecord);
            userDb.item.upsert(parsed);
            logger.info(
              { scope: 'item-record', itemRecordId: parsed.id },
              'Item record upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'item_records',
              recordName: parsed.displayName,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', itemRecordId: parsed.id },
              'Audit log created for item record upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Item records upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'item-record',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert item records',
        );
        return {
          success: false,
          message: 'Failed to upsert item records',
        };
      }
    },
  );
}
