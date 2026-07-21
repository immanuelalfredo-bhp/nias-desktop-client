import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerModeIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('mode:list-active', async (_event): Promise<Envelope<attribute.Mode[]>> => {
    try {
      const modes = userDb.mode.listActive();
      logger.info(
        { scope: 'mode', modeCount: modes.length },
        'Active modes retrieved successfully',
      );
      return {
        success: true,
        message: 'Active modes retrieved successfully',
        data: modes,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'mode',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active modes',
      );
      return {
        success: false,
        message: 'Failed to retrieve active modes',
      };
    }
  });

  ipcMain.handle('mode:list-deleted', async (_event): Promise<Envelope<attribute.Mode[]>> => {
    try {
      const modes = userDb.mode.listDeleted();
      logger.info(
        { scope: 'mode', modeCount: modes.length },
        'Deleted modes retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted modes retrieved successfully',
        data: modes,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'mode',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted modes',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted modes',
      };
    }
  });

  ipcMain.handle(
    'mode:get-by-id',
    async (_event, modeId: string): Promise<Envelope<attribute.Mode | null>> => {
      try {
        const mode = userDb.mode.getById(modeId);
        if (!mode) {
          logger.error({ scope: 'mode', modeId }, 'Mode not found');
          return {
            success: false,
            message: 'Mode not found',
          };
        }
        logger.info({ scope: 'mode', modeId }, 'Mode retrieved successfully');
        return {
          success: true,
          message: 'Mode retrieved successfully',
          data: mode,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'mode',
            modeId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve mode',
        );
        return {
          success: false,
          message: 'Failed to retrieve mode',
        };
      }
    },
  );

  ipcMain.handle(
    'mode:create',
    async (_event, payload: attribute.CreateModeInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateModeInputSchema.parse(payload);

        const data: attribute.CreateMode = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          sortOrder: parsed.sortOrder,
        };

        userDb.mode.create(data);
        logger.info({ scope: 'mode', modeId: data.id }, 'Mode created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'modes',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', modeId: data.id }, 'Audit log created for mode creation');

        return {
          success: true,
          message: 'Mode created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'mode',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create mode',
        );
        return {
          success: false,
          message: 'Failed to create mode',
        };
      }
    },
  );

  ipcMain.handle(
    'mode:update',
    async (_event, payload: attribute.UpdateModeInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateModeInputSchema.parse(payload);
        const existing = userDb.mode.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'mode', modeId: parsed.id }, 'Mode not found for update');
          return {
            success: false,
            message: 'Mode not found for update',
          };
        }

        const updatedData: attribute.UpdateMode = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          sortOrder: parsed.sortOrder,
        };

        userDb.mode.update(updatedData);
        logger.info({ scope: 'mode', modeId: parsed.id }, 'Mode updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'modes',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', modeId: parsed.id }, 'Audit log created for mode update');

        return {
          success: true,
          message: 'Mode updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'mode',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update mode',
        );
        return {
          success: false,
          message: 'Failed to update mode',
        };
      }
    },
  );

  ipcMain.handle('mode:delete', async (_event, modeId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.mode.getById(modeId);
      if (!existing) {
        logger.error({ scope: 'mode', modeId }, 'Mode not found for deletion');
        return {
          success: false,
          message: 'Mode not found for deletion',
        };
      }
      userDb.mode.delete(modeId);
      logger.info({ scope: 'mode', modeId }, 'Mode deleted successfully');

      createAuditLog(userDb, userId, {
        action: 'delete',
        tableName: 'modes',
        recordName: existing.name,
        recordId: modeId,
      });
      logger.info({ scope: 'audit', modeId }, 'Audit log created for mode deletion');

      return {
        success: true,
        message: 'Mode deleted successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'mode',
          modeId,
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to delete mode',
      );
      return {
        success: false,
        message: 'Failed to delete mode',
      };
    }
  });

  ipcMain.handle(
    'mode:restore',
    async (_event, modeId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.mode.getById(modeId);
        if (!existing) {
          logger.error({ scope: 'mode', modeId }, 'Mode not found for restoration');
          return {
            success: false,
            message: 'Mode not found for restoration',
          };
        }
        userDb.mode.restore(modeId);
        logger.info({ scope: 'mode', modeId }, 'Mode restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'modes',
          recordName: existing.name,
          recordId: modeId,
        });
        logger.info({ scope: 'audit', modeId }, 'Audit log created for mode restoration');

        return {
          success: true,
          message: 'Mode restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'mode',
            modeId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore mode',
        );
        return {
          success: false,
          message: 'Failed to restore mode',
        };
      }
    },
  );

  ipcMain.handle(
    'mode:upsert',
    async (_event, payload: attribute.Mode[]): Promise<common.SuccessResponse> => {
      try {
        userDb.mode.transaction(() => {
          for (const mode of payload) {
            const parsed = attribute.ModeSchema.parse(mode);
            userDb.mode.upsert(parsed);
            logger.info({ scope: 'mode', modeId: parsed.id }, 'Mode upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'modes',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info({ scope: 'audit', modeId: parsed.id }, 'Audit log created for mode upsert');
          }
        });
        return {
          success: true,
          message: 'Modes upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'mode',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert modes',
        );
        return {
          success: false,
          message: 'Failed to upsert modes',
        };
      }
    },
  );
}
