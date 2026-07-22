import { ipcMain } from 'electron';
import { order, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerRequestItemIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'request-item:list-active',
    async (_event): Promise<Envelope<order.RequestItem[]>> => {
      try {
        const requestItems = userDb.requestItem.listActive();
        logger.info(
          { scope: 'request-item', requestItemCount: requestItems.length },
          'Active request items retrieved successfully',
        );
        return {
          success: true,
          message: 'Active request items retrieved successfully',
          data: requestItems,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active request items',
        );
        return {
          success: false,
          message: 'Failed to retrieve active request items',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:list-deleted',
    async (_event): Promise<Envelope<order.RequestItem[]>> => {
      try {
        const requestItems = userDb.requestItem.listDeleted();
        logger.info(
          { scope: 'request-item', requestItemCount: requestItems.length },
          'Deleted request items retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted request items retrieved successfully',
          data: requestItems,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted request items',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted request items',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:get-by-id',
    async (_event, requestItemId: string): Promise<Envelope<order.RequestItem | null>> => {
      try {
        const requestItem = userDb.requestItem.getById(requestItemId);
        if (!requestItem) {
          logger.error({ scope: 'request-item', requestItemId }, 'Request item not found');
          return {
            success: false,
            message: 'Request item not found',
          };
        }
        logger.info(
          { scope: 'request-item', requestItemId },
          'Request item retrieved successfully',
        );
        return {
          success: true,
          message: 'Request item retrieved successfully',
          data: requestItem,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            requestItemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve request item',
        );
        return {
          success: false,
          message: 'Failed to retrieve request item',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:create',
    async (_event, payload: order.CreateRequestItemInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = order.CreateRequestItemInputSchema.parse(payload);

        const data: order.CreateRequestItem = {
          id: crypto.randomUUID(),
          requestId: parsed.requestId,
          variantId: parsed.variantId,
          quantity: parsed.quantity,
          price: parsed.price,
          total: parsed.total,
          comments: parsed.comments,
        };

        userDb.requestItem.create(data);
        logger.info(
          { scope: 'request-item', requestItemId: data.id },
          'Request item created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'request_items',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', requestItemId: data.id },
          'Audit log created for request item creation',
        );

        return {
          success: true,
          message: 'Request item created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create request item',
        );
        return {
          success: false,
          message: 'Failed to create request item',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:update',
    async (_event, payload: order.UpdateRequestItem): Promise<common.SuccessResponse> => {
      try {
        const parsed = order.UpdateRequestItemSchema.parse(payload);
        const existing = userDb.requestItem.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'request-item', requestItemId: parsed.id },
            'Request item not found for update',
          );
          return {
            success: false,
            message: 'Request item not found for update',
          };
        }

        const updatedData: order.UpdateRequestItem = {
          id: parsed.id,
          requestId: existing.requestId,
          variantId: parsed.variantId ?? existing.variantId,
          quantity: parsed.quantity ?? existing.quantity,
          price: parsed.price ?? existing.price,
          total: parsed.total ?? existing.total,
          comments: parsed.comments ?? existing.comments,
        };

        userDb.requestItem.update(updatedData);
        logger.info(
          { scope: 'request-item', requestItemId: parsed.id },
          'Request item updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'request_items',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', requestItemId: parsed.id },
          'Audit log created for request item update',
        );

        return {
          success: true,
          message: 'Request item updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update request item',
        );
        return {
          success: false,
          message: 'Failed to update request item',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:delete',
    async (_event, requestItemId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.requestItem.getById(requestItemId);
        if (!existing) {
          logger.error(
            { scope: 'request-item', requestItemId },
            'Request item not found for deletion',
          );
          return {
            success: false,
            message: 'Request item not found for deletion',
          };
        }
        userDb.requestItem.delete(requestItemId);
        logger.info({ scope: 'request-item', requestItemId }, 'Request item deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'request_items',
          recordName: existing.id,
          recordId: requestItemId,
        });
        logger.info(
          { scope: 'audit', requestItemId },
          'Audit log created for request item deletion',
        );

        return {
          success: true,
          message: 'Request item deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            requestItemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete request item',
        );
        return {
          success: false,
          message: 'Failed to delete request item',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:restore',
    async (_event, requestItemId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.requestItem.getById(requestItemId);
        if (!existing) {
          logger.error(
            { scope: 'request-item', requestItemId },
            'Request item not found for restoration',
          );
          return {
            success: false,
            message: 'Request item not found for restoration',
          };
        }
        userDb.requestItem.restore(requestItemId);
        logger.info({ scope: 'request-item', requestItemId }, 'Request item restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'request_items',
          recordName: existing.id,
          recordId: requestItemId,
        });
        logger.info(
          { scope: 'audit', requestItemId },
          'Audit log created for request item restoration',
        );

        return {
          success: true,
          message: 'Request item restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            requestItemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore request item',
        );
        return {
          success: false,
          message: 'Failed to restore request item',
        };
      }
    },
  );

  ipcMain.handle(
    'request-item:upsert',
    async (_event, payload: order.RequestItem[]): Promise<common.SuccessResponse> => {
      try {
        userDb.requestItem.transaction(() => {
          for (const requestItem of payload) {
            const parsed = order.RequestItemSchema.parse(requestItem);
            userDb.requestItem.upsert(parsed);
            logger.info(
              { scope: 'request-item', requestItemId: parsed.id },
              'Request item upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'request_items',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', requestItemId: parsed.id },
              'Audit log created for request item upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Request items upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert request items',
        );
        return {
          success: false,
          message: 'Failed to upsert request items',
        };
      }
    },
  );
}
