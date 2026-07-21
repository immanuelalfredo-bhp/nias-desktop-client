import { ipcMain } from 'electron';
import { variant, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerComponentMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'component-map:list-active',
    async (_event): Promise<Envelope<variant.ComponentMap[]>> => {
      try {
        const componentMaps = userDb.componentMap.listActive();
        logger.info(
          { scope: 'component-map', componentMapCount: componentMaps.length },
          'Active component maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active component maps retrieved successfully',
          data: componentMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active component maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active component maps',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:list-deleted',
    async (_event): Promise<Envelope<variant.ComponentMap[]>> => {
      try {
        const componentMaps = userDb.componentMap.listDeleted();
        logger.info(
          { scope: 'component-map', componentMapCount: componentMaps.length },
          'Deleted component maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted component maps retrieved successfully',
          data: componentMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted component maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted component maps',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:get-by-id',
    async (_event, componentMapId: string): Promise<Envelope<variant.ComponentMap | null>> => {
      try {
        const componentMap = userDb.componentMap.getById(componentMapId);
        if (!componentMap) {
          logger.error({ scope: 'component-map', componentMapId }, 'Component value not found');
          return {
            success: false,
            message: 'Component value not found',
          };
        }
        logger.info(
          { scope: 'component-map', componentMapId },
          'Component value retrieved successfully',
        );
        return {
          success: true,
          message: 'Component value retrieved successfully',
          data: componentMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            componentMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve component map',
        );
        return {
          success: false,
          message: 'Failed to retrieve component map',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:create',
    async (_event, payload: variant.CreateComponentMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.CreateComponentMapInputSchema.parse(payload);

        const data: variant.CreateComponentMap = {
          id: crypto.randomUUID(),
          variantId: parsed.variantId,
          componentId: parsed.componentId,
          quantity: parsed.quantity,
        };

        userDb.componentMap.create(data);
        logger.info(
          { scope: 'component-map', componentMapId: data.id },
          'Component map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'component_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', componentMapId: data.id },
          'Audit log created for component map creation',
        );

        return {
          success: true,
          message: 'Component map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create component map',
        );
        return {
          success: false,
          message: 'Failed to create component map',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:update',
    async (_event, payload: variant.UpdateComponentMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = variant.UpdateComponentMapSchema.parse(payload);
        const existing = userDb.componentMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'component-map', componentMapId: parsed.id },
            'Component map not found for update',
          );
          return {
            success: false,
            message: 'Component map not found for update',
          };
        }

        const updatedData: variant.UpdateComponentMap = {
          id: parsed.id,
          variantId: parsed.variantId,
          componentId: parsed.componentId,
          quantity: parsed.quantity,
        };

        userDb.componentMap.update(updatedData);
        logger.info(
          { scope: 'component-map', componentMapId: parsed.id },
          'Component map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'component_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', componentMapId: parsed.id },
          'Audit log created for component map update',
        );

        return {
          success: true,
          message: 'Component map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update component map',
        );
        return {
          success: false,
          message: 'Failed to update component map',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:delete',
    async (_event, componentMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.componentMap.getById(componentMapId);
        if (!existing) {
          logger.error(
            { scope: 'component-map', componentMapId },
            'Component map not found for deletion',
          );
          return {
            success: false,
            message: 'Component map not found for deletion',
          };
        }
        userDb.componentMap.delete(componentMapId);
        logger.info(
          { scope: 'component-map', componentMapId },
          'Component map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'component_maps',
          recordName: existing.id,
          recordId: componentMapId,
        });
        logger.info(
          { scope: 'audit', componentMapId },
          'Audit log created for component map deletion',
        );

        return {
          success: true,
          message: 'Component map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            componentMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete component map',
        );
        return {
          success: false,
          message: 'Failed to delete component map',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:restore',
    async (_event, componentMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.componentMap.getById(componentMapId);
        if (!existing) {
          logger.error(
            { scope: 'component-map', componentMapId },
            'Component map not found for restoration',
          );
          return {
            success: false,
            message: 'Component map not found for restoration',
          };
        }
        userDb.componentMap.restore(componentMapId);
        logger.info(
          { scope: 'component-map', componentMapId },
          'Component map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'component_maps',
          recordName: existing.id,
          recordId: componentMapId,
        });
        logger.info(
          { scope: 'audit', componentMapId },
          'Audit log created for component map restoration',
        );

        return {
          success: true,
          message: 'Component map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            componentMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore component map',
        );
        return {
          success: false,
          message: 'Failed to restore component map',
        };
      }
    },
  );

  ipcMain.handle(
    'component-map:upsert',
    async (_event, payload: variant.ComponentMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.componentMap.transaction(() => {
          for (const componentMap of payload) {
            const parsed = variant.ComponentMapSchema.parse(componentMap);
            userDb.componentMap.upsert(parsed);
            logger.info(
              { scope: 'component-map', componentMapId: parsed.id },
              'Component map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'component_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', componentMapId: parsed.id },
              'Audit log created for component map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Component maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'component-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert component maps',
        );
        return {
          success: false,
          message: 'Failed to upsert component maps',
        };
      }
    },
  );
}
