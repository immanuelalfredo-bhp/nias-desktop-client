import { ipcMain } from 'electron';
import { order, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerRequestIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('request:list-active', async (_event): Promise<Envelope<order.Request[]>> => {
    try {
      const requests = userDb.request.listActive();
      logger.info(
        { scope: 'request', requestCount: requests.length },
        'Active requests retrieved successfully',
      );
      return {
        success: true,
        message: 'Active requests retrieved successfully',
        data: requests,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'request',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active requests',
      );
      return {
        success: false,
        message: 'Failed to retrieve active requests',
      };
    }
  });

  ipcMain.handle('request:list-deleted', async (_event): Promise<Envelope<order.Request[]>> => {
    try {
      const requests = userDb.request.listDeleted();
      logger.info(
        { scope: 'request', requestCount: requests.length },
        'Deleted requests retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted requests retrieved successfully',
        data: requests,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'request',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted requests',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted requests',
      };
    }
  });

  ipcMain.handle(
    'request:get-by-id',
    async (_event, requestId: string): Promise<Envelope<order.Request | null>> => {
      try {
        const request = userDb.request.getById(requestId);
        if (!request) {
          logger.error({ scope: 'request', requestId }, 'Request not found');
          return {
            success: false,
            message: 'Request not found',
          };
        }
        logger.info({ scope: 'request', requestId }, 'Request retrieved successfully');
        return {
          success: true,
          message: 'Request retrieved successfully',
          data: request,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            requestId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve request',
        );
        return {
          success: false,
          message: 'Failed to retrieve request',
        };
      }
    },
  );

  ipcMain.handle(
    'request:create',
    async (_event, payload: order.CreateRequestInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = order.CreateRequestInputSchema.parse(payload);

        const data: order.CreateRequest = {
          id: crypto.randomUUID(),
          userId: userId,
          projectId: parsed.projectId,
          comments: parsed.comments,
        };

        userDb.request.create(data);
        logger.info({ scope: 'request', requestId: data.id }, 'Request created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'requests',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', requestId: data.id },
          'Audit log created for request creation',
        );

        return {
          success: true,
          message: 'Request created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create request',
        );
        return {
          success: false,
          message: 'Failed to create request',
        };
      }
    },
  );

  ipcMain.handle(
    'request:update',
    async (_event, payload: order.UpdateRequest): Promise<common.SuccessResponse> => {
      try {
        const parsed = order.UpdateRequestSchema.parse(payload);
        const existing = userDb.request.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'request', requestId: parsed.id }, 'Request not found for update');
          return {
            success: false,
            message: 'Request not found for update',
          };
        }

        const updatedData: order.UpdateRequest = {
          id: parsed.id,
          userId: existing.userId,
          projectId: parsed.projectId ?? existing.projectId,
          comments: parsed.comments ?? existing.comments,
        };

        userDb.request.update(updatedData);
        logger.info({ scope: 'request', requestId: parsed.id }, 'Request updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'requests',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', requestId: parsed.id },
          'Audit log created for request update',
        );

        return {
          success: true,
          message: 'Request updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update request',
        );
        return {
          success: false,
          message: 'Failed to update request',
        };
      }
    },
  );

  ipcMain.handle(
    'request:delete',
    async (_event, requestId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.request.getById(requestId);
        if (!existing) {
          logger.error({ scope: 'request', requestId }, 'Request not found for deletion');
          return {
            success: false,
            message: 'Request not found for deletion',
          };
        }
        userDb.request.delete(requestId);
        logger.info({ scope: 'request', requestId }, 'Request deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'requests',
          recordName: existing.id,
          recordId: requestId,
        });
        logger.info({ scope: 'audit', requestId }, 'Audit log created for request deletion');

        return {
          success: true,
          message: 'Request deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            requestId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete request',
        );
        return {
          success: false,
          message: 'Failed to delete request',
        };
      }
    },
  );

  ipcMain.handle(
    'request:restore',
    async (_event, requestId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.request.getById(requestId);
        if (!existing) {
          logger.error({ scope: 'request', requestId }, 'Request not found for restoration');
          return {
            success: false,
            message: 'Request not found for restoration',
          };
        }
        userDb.request.restore(requestId);
        logger.info({ scope: 'request', requestId }, 'Request restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'requests',
          recordName: existing.id,
          recordId: requestId,
        });
        logger.info({ scope: 'audit', requestId }, 'Audit log created for request restoration');

        return {
          success: true,
          message: 'Request restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            requestId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore request',
        );
        return {
          success: false,
          message: 'Failed to restore request',
        };
      }
    },
  );

  ipcMain.handle(
    'request:upsert',
    async (_event, payload: order.Request[]): Promise<common.SuccessResponse> => {
      try {
        userDb.request.transaction(() => {
          for (const request of payload) {
            const parsed = order.RequestSchema.parse(request);
            userDb.request.upsert(parsed);
            logger.info(
              { scope: 'request', requestId: parsed.id },
              'Request upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'requests',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', requestId: parsed.id },
              'Audit log created for request upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Requests upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'request',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert requests',
        );
        return {
          success: false,
          message: 'Failed to upsert requests',
        };
      }
    },
  );
}
