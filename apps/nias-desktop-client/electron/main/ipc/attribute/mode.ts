import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';

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
        const newMode: attribute.Mode = {
          id: crypto.randomUUID(),
          name: payload.name,
          normalizedName: slugify(payload.name),
          sortOrder: payload.sortOrder,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          isSynced: false,
          syncVersion: 0,
        };
        userDb.mode.createMode(newMode);
        logger.info({ scope: 'modes', modeId: newMode.id }, 'Mode created successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'create',
          tableName: 'modes',
          recordId: newMode.id,
          timestamp: new Date().toISOString(),
          details: `Mode ${newMode.name} created by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

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
        const updatedMode: attribute.UpdateMode = {
          id: crypto.randomUUID(),
          name: payload.name,
          normalizedName: slugify(payload.name!),
          sortOrder: payload.sortOrder,
          updatedAt: new Date().toISOString(),
        };
        userDb.mode.updateMode(updatedMode);
        logger.info({ scope: 'modes', modeId: updatedMode.id }, 'Mode updated successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'update',
          tableName: 'modes',
          recordId: updatedMode.id!,
          timestamp: new Date().toISOString(),
          details: `Mode ${updatedMode.name} updated by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

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
        userDb.mode.deleteMode(payload);
        logger.info({ scope: 'modes', modeId: payload.id }, 'Mode deleted successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'delete',
          tableName: 'modes',
          recordId: payload.id,
          timestamp: new Date().toISOString(),
          details: `Mode ${payload.id} deleted by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

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
        userDb.mode.restoreMode(payload);
        logger.info({ scope: 'modes', modeId: payload.id }, 'Mode restored successfully');

        const actor = userDb.user.findUserById(userId);
        userDb.audit.createAuditLog({
          id: crypto.randomUUID(),
          userId: userId,
          action: 'restore',
          tableName: 'modes',
          recordId: payload.id,
          timestamp: new Date().toISOString(),
          details: `Mode ${payload.id} restored by ${actor?.displayName || 'Unknown User'}`,
          isSynced: false,
          syncVersion: 0,
        });

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
