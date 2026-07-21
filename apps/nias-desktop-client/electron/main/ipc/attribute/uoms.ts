import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerUomIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('uom:list-active', async (_event): Promise<Envelope<attribute.Uom[]>> => {
    try {
      const uoms = userDb.uom.listActive();
      logger.info({ scope: 'uom', uomCount: uoms.length }, 'Active uoms retrieved successfully');
      return {
        success: true,
        message: 'Active uoms retrieved successfully',
        data: uoms,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'uom',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active uoms',
      );
      return {
        success: false,
        message: 'Failed to retrieve active uoms',
      };
    }
  });

  ipcMain.handle('uom:list-deleted', async (_event): Promise<Envelope<attribute.Uom[]>> => {
    try {
      const uoms = userDb.uom.listDeleted();
      logger.info({ scope: 'uom', uomCount: uoms.length }, 'Deleted uoms retrieved successfully');
      return {
        success: true,
        message: 'Deleted uoms retrieved successfully',
        data: uoms,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'uom',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted uoms',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted uoms',
      };
    }
  });

  ipcMain.handle(
    'uom:get-by-id',
    async (_event, uomId: string): Promise<Envelope<attribute.Uom | null>> => {
      try {
        const uom = userDb.uom.getById(uomId);
        if (!uom) {
          logger.error({ scope: 'uom', uomId }, 'Uom not found');
          return {
            success: false,
            message: 'Uom not found',
          };
        }
        logger.info({ scope: 'uom', uomId }, 'Uom retrieved successfully');
        return {
          success: true,
          message: 'Uom retrieved successfully',
          data: uom,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'uom',
            uomId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve uom',
        );
        return {
          success: false,
          message: 'Failed to retrieve uom',
        };
      }
    },
  );

  ipcMain.handle(
    'uom:create',
    async (_event, payload: attribute.CreateUomInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateUomInputSchema.parse(payload);

        const data: attribute.CreateUom = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          symbol: parsed.symbol,
          sortOrder: parsed.sortOrder,
        };

        userDb.uom.create(data);
        logger.info({ scope: 'uom', uomId: data.id }, 'Uom created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'uoms',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', uomId: data.id }, 'Audit log created for uom creation');

        return {
          success: true,
          message: 'Uom created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'uom',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create uom',
        );
        return {
          success: false,
          message: 'Failed to create uom',
        };
      }
    },
  );

  ipcMain.handle(
    'uom:update',
    async (_event, payload: attribute.UpdateUomInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateUomInputSchema.parse(payload);
        const existing = userDb.uom.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'uom', uomId: parsed.id }, 'Uom not found for update');
          return {
            success: false,
            message: 'Uom not found for update',
          };
        }

        const updatedData: attribute.UpdateUom = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          symbol: parsed.symbol,
          sortOrder: parsed.sortOrder,
        };

        userDb.uom.update(updatedData);
        logger.info({ scope: 'uom', uomId: parsed.id }, 'Uom updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'uoms',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', uomId: parsed.id }, 'Audit log created for uom update');

        return {
          success: true,
          message: 'Uom updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'uom',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update uom',
        );
        return {
          success: false,
          message: 'Failed to update uom',
        };
      }
    },
  );

  ipcMain.handle('uom:delete', async (_event, uomId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.uom.getById(uomId);
      if (!existing) {
        logger.error({ scope: 'uom', uomId }, 'Uom not found for deletion');
        return {
          success: false,
          message: 'Uom not found for deletion',
        };
      }
      userDb.uom.delete(uomId);
      logger.info({ scope: 'uom', uomId }, 'Uom deleted successfully');

      createAuditLog(userDb, userId, {
        action: 'delete',
        tableName: 'uoms',
        recordName: existing.name,
        recordId: uomId,
      });
      logger.info({ scope: 'audit', uomId }, 'Audit log created for uom deletion');

      return {
        success: true,
        message: 'Uom deleted successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'uom',
          uomId,
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to delete uom',
      );
      return {
        success: false,
        message: 'Failed to delete uom',
      };
    }
  });

  ipcMain.handle('uom:restore', async (_event, uomId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.uom.getById(uomId);
      if (!existing) {
        logger.error({ scope: 'uom', uomId }, 'Uom not found for restoration');
        return {
          success: false,
          message: 'Uom not found for restoration',
        };
      }
      userDb.uom.restore(uomId);
      logger.info({ scope: 'uom', uomId }, 'Uom restored successfully');

      createAuditLog(userDb, userId, {
        action: 'restore',
        tableName: 'uoms',
        recordName: existing.name,
        recordId: uomId,
      });
      logger.info({ scope: 'audit', uomId }, 'Audit log created for uom restoration');

      return {
        success: true,
        message: 'Uom restored successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'uom',
          uomId,
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to restore uom',
      );
      return {
        success: false,
        message: 'Failed to restore uom',
      };
    }
  });

  ipcMain.handle(
    'uom:upsert',
    async (_event, payload: attribute.Uom[]): Promise<common.SuccessResponse> => {
      try {
        userDb.uom.transaction(() => {
          for (const uom of payload) {
            const parsed = attribute.UomSchema.parse(uom);
            userDb.uom.upsert(parsed);
            logger.info({ scope: 'uom', uomId: parsed.id }, 'Uom upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'uoms',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info({ scope: 'audit', uomId: parsed.id }, 'Audit log created for uom upsert');
          }
        });
        return {
          success: true,
          message: 'Uoms upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'uom',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert uoms',
        );
        return {
          success: false,
          message: 'Failed to upsert uoms',
        };
      }
    },
  );
}
