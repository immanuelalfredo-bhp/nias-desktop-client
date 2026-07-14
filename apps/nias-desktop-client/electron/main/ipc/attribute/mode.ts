import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../../utils';

export function registerModeIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('mode:list-active', async (_event): Promise<Envelope<attribute.Mode[]>> => {
    try {
      const modes = userDb.mode.listModes();
      logger.info(
        { scope: 'modes', modeCount: modes.length },
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
          scope: 'modes',
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
      const modes = userDb.mode.listDeletedModes();
      logger.info(
        { scope: 'modes', modeCount: modes.length },
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
          scope: 'modes',
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
    'mode:create',
    async (_event, payload: attribute.CreateModeInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateModeInputSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'modes',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid mode creation payload',
          );
          return { success: false, message: 'Invalid mode creation payload' };
        }

        const newMode: attribute.CreateMode = {
          id: crypto.randomUUID(),
          name: parsed.data.name,
          normalizedName: slugify(parsed.data.name),
          sortOrder: parsed.data.sortOrder,
        };
        userDb.mode.createMode(newMode);
        logger.info({ scope: 'modes', modeId: newMode.id }, 'Mode created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'modes',
          recordId: newMode.id,
          details: `Mode ${newMode.name} created by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info({ scope: 'audit', modeId: newMode.id }, 'Audit log created for mode creation');

        return { success: true, message: 'Mode created successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'modes',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create mode',
        );
        return { success: false, message: 'Failed to create mode' };
      }
    },
  );

  ipcMain.handle(
    'mode:update',
    async (_event, payload: attribute.UpdateModeInput): Promise<common.SuccessResponse> => {
      try {
        // should be impossible to reach here without an id, but just in case
        if (!payload.id) {
          return { success: false, message: 'Mode id is required for updates' };
        }

        const parsed = attribute.UpdateModeInputSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'modes',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid mode update payload',
          );
          return { success: false, message: 'Invalid mode update payload' };
        }

        const updatedMode: attribute.UpdateMode = {
          id: payload.id,
          name: payload.name,
          normalizedName: payload.name ? slugify(payload.name) : undefined,
          sortOrder: payload.sortOrder,
        };
        userDb.mode.updateMode(updatedMode);
        logger.info({ scope: 'modes', modeId: updatedMode.id }, 'Mode updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'modes',
          recordId: updatedMode.id,
          details: `Mode ${updatedMode.name} updated by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', modeId: updatedMode.id },
          'Audit log created for mode update',
        );

        return { success: true, message: 'Mode updated successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'modes',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update mode',
        );
        return { success: false, message: 'Failed to update mode' };
      }
    },
  );

  ipcMain.handle(
    'mode:delete',
    async (_event, payload: attribute.ModeId): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.ModeIdSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'modes',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid mode deletion payload',
          );
          return { success: false, message: 'Invalid mode deletion payload' };
        }

        userDb.mode.deleteMode(parsed.data);
        logger.info({ scope: 'modes', modeId: parsed.data.id }, 'Mode deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'modes',
          recordId: parsed.data.id,
          details: `Mode ${parsed.data.id} deleted by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', modeId: parsed.data.id },
          'Audit log created for mode deletion',
        );

        return { success: true, message: 'Mode deleted successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'modes',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete mode',
        );
        return { success: false, message: 'Failed to delete mode' };
      }
    },
  );

  ipcMain.handle(
    'mode:restore',
    async (_event, payload: attribute.ModeId): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.ModeIdSchema.safeParse(payload);
        if (!parsed.success) {
          logger.error(
            {
              scope: 'modes',
              err: parsed.error,
              errorMessage: parsed.error.message,
            },
            'Invalid mode restoration payload',
          );
          return { success: false, message: 'Invalid mode restoration payload' };
        }

        userDb.mode.restoreMode(parsed.data);
        logger.info({ scope: 'modes', modeId: parsed.data.id }, 'Mode restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'modes',
          recordId: parsed.data.id,
          details: `Mode ${parsed.data.id} restored by ${
            userDb.user.getUserById(userId)?.displayName || 'Unknown User'
          }`,
        });
        logger.info(
          { scope: 'audit', modeId: parsed.data.id },
          'Audit log created for mode restoration',
        );

        return { success: true, message: 'Mode restored successfully' };
      } catch (error) {
        logger.error(
          {
            scope: 'modes',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore mode',
        );
        return { success: false, message: 'Failed to restore mode' };
      }
    },
  );
}
