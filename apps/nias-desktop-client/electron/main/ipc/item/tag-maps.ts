import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerTagMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('tag-map:list-active', async (_event): Promise<Envelope<item.TagMap[]>> => {
    try {
      const tagMaps = userDb.tagMap.listActive();
      logger.info(
        { scope: 'tag-map', tagMapCount: tagMaps.length },
        'Active tag maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Active tag maps retrieved successfully',
        data: tagMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag-map',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active tag maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve active tag maps',
      };
    }
  });

  ipcMain.handle('tag-map:list-deleted', async (_event): Promise<Envelope<item.TagMap[]>> => {
    try {
      const tagMaps = userDb.tagMap.listDeleted();
      logger.info(
        { scope: 'tag-map', tagMapCount: tagMaps.length },
        'Deleted tag maps retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted tag maps retrieved successfully',
        data: tagMaps,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag-map',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted tag maps',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted tag maps',
      };
    }
  });

  ipcMain.handle(
    'tag-map:get-by-id',
    async (_event, tagMapId: string): Promise<Envelope<item.TagMap>> => {
      try {
        const tagMap = userDb.tagMap.getById(tagMapId);
        if (!tagMap) {
          logger.error({ scope: 'tag-map', tagMapId }, 'Tag map not found');
          return {
            success: false,
            message: 'Tag map not found',
          };
        }
        logger.info({ scope: 'tag-map', tagMapId }, 'Tag map retrieved successfully');
        return {
          success: true,
          message: 'Tag map retrieved successfully',
          data: tagMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            tagMapId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve tag map',
        );
        return {
          success: false,
          message: 'Failed to retrieve tag map',
        };
      }
    },
  );

  ipcMain.handle(
    'tag-map:create',
    async (_event, payload: item.CreateTagMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateTagMapInputSchema.parse(payload);

        const existingDeleted = userDb.tagMap.getByIds(parsed.itemId, parsed.tagId);
        if (existingDeleted) {
          userDb.tagMap.restore(existingDeleted.id);
          logger.info(
            { scope: 'tag-map', tagMapId: existingDeleted.id },
            'Tag map restored successfully',
          );
          createAuditLog(userDb, userId, {
            action: 'restore',
            tableName: 'tag_maps',
            recordId: existingDeleted.id,
            recordName: existingDeleted.id,
          });
          logger.info(
            { scope: 'audit', tagMapId: existingDeleted.id },
            'Audit log created for tag map restoration',
          );
          return {
            success: true,
            message: 'Tag map restored successfully',
          };
        }

        const data: item.CreateTagMap = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          tagId: parsed.tagId,
        };

        userDb.tagMap.create(data);
        logger.info({ scope: 'tag-map', tagMapId: data.id }, 'Tag map created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'tag_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', tagMapId: data.id },
          'Audit log created for tag map creation',
        );

        return {
          success: true,
          message: 'Tag map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create tag map',
        );
        return {
          success: false,
          message: 'Failed to create tag map',
        };
      }
    },
  );

  ipcMain.handle(
    'tag-map:update',
    async (_event, payload: item.UpdateTagMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateTagMapSchema.parse(payload);
        const existing = userDb.tagMap.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'tag-map', tagMapId: parsed.id }, 'Tag map not found for update');
          return {
            success: false,
            message: 'Tag map not found for update',
          };
        }

        const updatedData: item.UpdateTagMap = {
          id: parsed.id,
          itemId: parsed.itemId,
          tagId: parsed.tagId,
        };

        userDb.tagMap.update(updatedData);
        logger.info({ scope: 'tag-map', tagMapId: parsed.id }, 'Tag map updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'tag_maps',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', tagMapId: parsed.id },
          'Audit log created for tag map update',
        );

        return {
          success: true,
          message: 'Tag map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update tag map',
        );
        return {
          success: false,
          message: 'Failed to update tag map',
        };
      }
    },
  );

  ipcMain.handle(
    'tag-map:delete',
    async (_event, itemId: string, tagId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.tagMap.getByIds(itemId, tagId);
        if (!existing) {
          logger.error({ scope: 'tag-map', itemId, tagId }, 'Tag map not found for deletion');
          return {
            success: false,
            message: 'Tag map not found for deletion',
          };
        }
        userDb.tagMap.delete(existing.id);
        logger.info({ scope: 'tag-map', itemId, tagId }, 'Tag map deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'tag_maps',
          recordName: existing.id,
          recordId: existing.id,
        });
        logger.info({ scope: 'audit', tagMapId: existing.id }, 'Audit log created for tag map deletion');

        return {
          success: true,
          message: 'Tag map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete tag map',
        );
        return {
          success: false,
          message: 'Failed to delete tag map',
        };
      }
    },
  );

  ipcMain.handle(
    'tag-map:restore',
    async (_event, itemId: string, tagId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.tagMap.getByIds(itemId, tagId);
        if (!existing) {
          logger.error({ scope: 'tag-map', itemId, tagId }, 'Tag map not found for restoration');
          return {
            success: false,
            message: 'Tag map not found for restoration',
          };
        }
        userDb.tagMap.restore(existing.id);
        logger.info({ scope: 'tag-map', itemId, tagId }, 'Tag map restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'tag_maps',
          recordName: existing.id,
          recordId: existing.id,
        });
        logger.info({ scope: 'audit', tagMapId: existing.id }, 'Audit log created for tag map restoration');

        return {
          success: true,
          message: 'Tag map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore tag map',
        );
        return {
          success: false,
          message: 'Failed to restore tag map',
        };
      }
    },
  );

  ipcMain.handle(
    'tag-map:upsert',
    async (_event, payload: item.TagMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.tagMap.transaction(() => {
          for (const tagMap of payload) {
            const parsed = item.TagMapSchema.parse(tagMap);
            userDb.tagMap.upsert(parsed);
            logger.info({ scope: 'tag-map', tagMapId: parsed.id }, 'Tag map upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'tag_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', tagMapId: parsed.id },
              'Audit log created for tag map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Tag maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag-map',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert tag maps',
        );
        return {
          success: false,
          message: 'Failed to upsert tag maps',
        };
      }
    },
  );
}
