import { ipcMain } from 'electron';
import { variant, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerSwitchMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'switch-map:list-active',
    async (_event): Promise<Envelope<variant.SwitchMap[]>> => {
      try {
        const switchMaps = userDb.switchMap.listActive();
        logger.info(
          { scope: 'switch-map', switchMapCount: switchMaps.length },
          'Active switch maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active switch maps retrieved successfully',
          data: switchMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active switch maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active switch maps',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:list-deleted',
    async (_event): Promise<Envelope<variant.SwitchMap[]>> => {
      try {
        const switchMaps = userDb.switchMap.listDeleted();
        logger.info(
          { scope: 'switch-map', switchMapCount: switchMaps.length },
          'Deleted switch maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted switch maps retrieved successfully',
          data: switchMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted switch maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted switch maps',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:get-by-id',
    async (_event, switchMapId: string): Promise<Envelope<variant.SwitchMap | null>> => {
      try {
        const switchMap = userDb.switchMap.getById(switchMapId);
        if (!switchMap) {
          logger.error({ scope: 'switch-map', switchMapId }, 'Switch value not found');
          return {
            success: false,
            message: 'Switch value not found',
          };
        }
        logger.info({ scope: 'switch-map', switchMapId }, 'Switch value retrieved successfully');
        return {
          success: true,
          message: 'Switch value retrieved successfully',
          data: switchMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            switchMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve switch map',
        );
        return {
          success: false,
          message: 'Failed to retrieve switch map',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:create',
    async (_event, payload: variant.CreateSwitchMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.CreateSwitchMapInputSchema.parse(payload);

        const data: variant.CreateSwitchMap = {
          id: crypto.randomUUID(),
          variantId: parsed.variantId,
          assemblyId: parsed.assemblyId,
        };

        userDb.switchMap.create(data);
        logger.info(
          { scope: 'switch-map', switchMapId: data.id },
          'Switch map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'switch_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', switchMapId: data.id },
          'Audit log created for switch map creation',
        );

        return {
          success: true,
          message: 'Switch map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create switch map',
        );
        return {
          success: false,
          message: 'Failed to create switch map',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:update',
    async (_event, payload: variant.UpdateSwitchMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.UpdateSwitchMapSchema.parse(payload);
        const existing = userDb.switchMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'switch-map', switchMapId: parsed.id },
            'Switch map not found for update',
          );
          return {
            success: false,
            message: 'Switch map not found for update',
          };
        }

        const updatedData: variant.UpdateSwitchMap = {
          id: parsed.id,
          variantId: parsed.variantId,
          assemblyId: parsed.assemblyId,
        };

        userDb.switchMap.update(updatedData);
        logger.info(
          { scope: 'switch-map', switchMapId: parsed.id },
          'Switch map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'switch_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', switchMapId: parsed.id },
          'Audit log created for switch map update',
        );

        return {
          success: true,
          message: 'Switch map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update switch map',
        );
        return {
          success: false,
          message: 'Failed to update switch map',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:delete',
    async (_event, switchMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.switchMap.getById(switchMapId);
        if (!existing) {
          logger.error({ scope: 'switch-map', switchMapId }, 'Switch map not found for deletion');
          return {
            success: false,
            message: 'Switch map not found for deletion',
          };
        }
        userDb.switchMap.delete(switchMapId);
        logger.info({ scope: 'switch-map', switchMapId }, 'Switch map deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'switch_maps',
          recordName: existing.id,
          recordId: switchMapId,
        });
        logger.info({ scope: 'audit', switchMapId }, 'Audit log created for switch map deletion');

        return {
          success: true,
          message: 'Switch map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            switchMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete switch map',
        );
        return {
          success: false,
          message: 'Failed to delete switch map',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:restore',
    async (_event, switchMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.switchMap.getById(switchMapId);
        if (!existing) {
          logger.error(
            { scope: 'switch-map', switchMapId },
            'Switch map not found for restoration',
          );
          return {
            success: false,
            message: 'Switch map not found for restoration',
          };
        }
        userDb.switchMap.restore(switchMapId);
        logger.info({ scope: 'switch-map', switchMapId }, 'Switch map restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'switch_maps',
          recordName: existing.id,
          recordId: switchMapId,
        });
        logger.info(
          { scope: 'audit', switchMapId },
          'Audit log created for switch map restoration',
        );

        return {
          success: true,
          message: 'Switch map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            switchMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore switch map',
        );
        return {
          success: false,
          message: 'Failed to restore switch map',
        };
      }
    },
  );

  ipcMain.handle(
    'switch-map:upsert',
    async (_event, payload: variant.SwitchMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.switchMap.transaction(() => {
          for (const switchMap of payload) {
            const parsed = variant.SwitchMapSchema.parse(switchMap);
            userDb.switchMap.upsert(parsed);
            logger.info(
              { scope: 'switch-map', switchMapId: parsed.id },
              'Switch map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'switch_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', switchMapId: parsed.id },
              'Audit log created for switch map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Switch maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'switch-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert switch maps',
        );
        return {
          success: false,
          message: 'Failed to upsert switch maps',
        };
      }
    },
  );
}
