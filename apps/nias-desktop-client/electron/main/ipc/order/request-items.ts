import { ipcMain } from 'electron';
import { order, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';

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
    async (_event, requestItemId: string): Promise<Envelope<order.RequestItem>> => {
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
          variantId: parsed.variantId,
          quantity: parsed.quantity,
          comments: parsed.comments,
        };

        userDb.requestItem.create(data);
        logger.info(
          { scope: 'request-item', requestItemId: data.id },
          'Request item created successfully',
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
          variantId: parsed.variantId ?? existing.variantId,
          quantity: parsed.quantity ?? existing.quantity,
          comments: parsed.comments ?? existing.comments,
        };

        userDb.requestItem.update(updatedData);
        logger.info(
          { scope: 'request-item', requestItemId: parsed.id },
          'Request item updated successfully',
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

  ipcMain.handle('request-item:list-with-info', async (_event): Promise<Envelope<any[]>> => {
    try {
      const requestItemsWithInfo = userDb.requestItem.listWithInfo();
      logger.info(
        { scope: 'request-item', requestItemCount: requestItemsWithInfo.length },
        'Request items with info retrieved successfully',
      );
      return {
        success: true,
        message: 'Request items with info retrieved successfully',
        data: requestItemsWithInfo,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'request-item',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve request items with info',
      );
      return {
        success: false,
        message: 'Failed to retrieve request items with info',
      };
    }
  });
  ipcMain.handle(
    'request-item:hard-delete',
    async (_event, requestItemId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.requestItem.getById(requestItemId);
        if (!existing) {
          logger.error(
            { scope: 'request-item', requestItemId },
            'Request item not found for hard deletion',
          );
          return {
            success: false,
            message: 'Request item not found for hard deletion',
          };
        }
        userDb.requestItem.hardDelete(requestItemId);
        logger.info(
          { scope: 'request-item', requestItemId },
          'Request item hard deleted successfully',
        );
        return {
          success: true,
          message: 'Request item hard deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to hard delete request item',
        );
        return {
          success: false,
          message: 'Failed to hard delete request item',
        };
      }
    },
  );
  ipcMain.handle(
    'request-item:edit-quantity',
    async (
      _event,
      payload: { id: string; newQuantity: number },
    ): Promise<common.SuccessResponse> => {
      try {
        const { id, newQuantity } = payload;
        const existing = userDb.requestItem.getById(id);
        if (!existing) {
          logger.error(
            { scope: 'request-item', requestItemId: id },
            'Request item not found for quantity edit',
          );
          return {
            success: false,
            message: 'Request item not found for quantity edit',
          };
        }
        userDb.requestItem.editQuantity(id, newQuantity);
        logger.info(
          { scope: 'request-item', requestItemId: id },
          'Request item quantity edited successfully',
        );
        return {
          success: true,
          message: 'Request item quantity edited successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request-item',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to edit request item quantity',
        );
        return {
          success: false,
          message: 'Failed to edit request item quantity',
        };
      }
    },
  );
  ipcMain.handle('request-item:clear', async (_event): Promise<common.SuccessResponse> => {
    try {
      userDb.requestItem.clear();
      logger.info({ scope: 'request-item' }, 'All request items cleared successfully');
      return {
        success: true,
        message: 'All request items cleared successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'request-item',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to clear all request items',
      );
      return {
        success: false,
        message: 'Failed to clear all request items',
      };
    }
  });
}
