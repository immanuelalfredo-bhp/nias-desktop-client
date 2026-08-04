import { ipcMain } from 'electron';
import { attribute, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerTagIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('tag:list-active', async (_event): Promise<Envelope<attribute.Tag[]>> => {
    try {
      const tags = userDb.tag.listActive();
      logger.info({ scope: 'tag', tagCount: tags.length }, 'Active tags retrieved successfully');
      return {
        success: true,
        message: 'Active tags retrieved successfully',
        data: tags,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active tags',
      );
      return {
        success: false,
        message: 'Failed to retrieve active tags',
      };
    }
  });

  ipcMain.handle('tag:list-deleted', async (_event): Promise<Envelope<attribute.Tag[]>> => {
    try {
      const tags = userDb.tag.listDeleted();
      logger.info({ scope: 'tag', tagCount: tags.length }, 'Deleted tags retrieved successfully');
      return {
        success: true,
        message: 'Deleted tags retrieved successfully',
        data: tags,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted tags',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted tags',
      };
    }
  });

  ipcMain.handle(
    'tag:get-by-id',
    async (_event, tagId: string): Promise<Envelope<attribute.Tag>> => {
      try {
        const tag = userDb.tag.getById(tagId);
        if (!tag) {
          logger.error({ scope: 'tag', tagId }, 'Tag not found');
          return {
            success: false,
            message: 'Tag not found',
          };
        }
        logger.info({ scope: 'tag', tagId }, 'Tag retrieved successfully');
        return {
          success: true,
          message: 'Tag retrieved successfully',
          data: tag,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag',
            tagId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve tag',
        );
        return {
          success: false,
          message: 'Failed to retrieve tag',
        };
      }
    },
  );

  ipcMain.handle(
    'tag:create',
    async (_event, payload: attribute.CreateTagInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.CreateTagInputSchema.parse(payload);

        const data: attribute.CreateTag = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          sortOrder: parsed.sortOrder,
        };

        userDb.tag.create(data);
        logger.info({ scope: 'tag', tagId: data.id }, 'Tag created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'tags',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info({ scope: 'audit', tagId: data.id }, 'Audit log created for tag creation');

        return {
          success: true,
          message: 'Tag created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create tag',
        );
        return {
          success: false,
          message: 'Failed to create tag',
        };
      }
    },
  );

  ipcMain.handle(
    'tag:update',
    async (_event, payload: attribute.UpdateTagInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = attribute.UpdateTagInputSchema.parse(payload);
        const existing = userDb.tag.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'tag', tagId: parsed.id }, 'Tag not found for update');
          return {
            success: false,
            message: 'Tag not found for update',
          };
        }

        const updatedData: attribute.UpdateTag = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          sortOrder: parsed.sortOrder,
        };

        userDb.tag.update(updatedData);
        logger.info({ scope: 'tag', tagId: parsed.id }, 'Tag updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'tags',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', tagId: parsed.id }, 'Audit log created for tag update');

        return {
          success: true,
          message: 'Tag updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update tag',
        );
        return {
          success: false,
          message: 'Failed to update tag',
        };
      }
    },
  );

  ipcMain.handle('tag:delete', async (_event, tagId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.tag.getById(tagId);
      if (!existing) {
        logger.error({ scope: 'tag', tagId }, 'Tag not found for deletion');
        return {
          success: false,
          message: 'Tag not found for deletion',
        };
      }
      userDb.tag.delete(tagId);
      logger.info({ scope: 'tag', tagId }, 'Tag deleted successfully');

      createAuditLog(userDb, userId, {
        action: 'delete',
        tableName: 'tags',
        recordName: existing.name,
        recordId: tagId,
      });
      logger.info({ scope: 'audit', tagId }, 'Audit log created for tag deletion');

      return {
        success: true,
        message: 'Tag deleted successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag',
          tagId,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to delete tag',
      );
      return {
        success: false,
        message: 'Failed to delete tag',
      };
    }
  });

  ipcMain.handle('tag:restore', async (_event, tagId: string): Promise<common.SuccessResponse> => {
    try {
      const existing = userDb.tag.getById(tagId);
      if (!existing) {
        logger.error({ scope: 'tag', tagId }, 'Tag not found for restoration');
        return {
          success: false,
          message: 'Tag not found for restoration',
        };
      }
      userDb.tag.restore(tagId);
      logger.info({ scope: 'tag', tagId }, 'Tag restored successfully');

      createAuditLog(userDb, userId, {
        action: 'restore',
        tableName: 'tags',
        recordName: existing.name,
        recordId: tagId,
      });
      logger.info({ scope: 'audit', tagId }, 'Audit log created for tag restoration');

      return {
        success: true,
        message: 'Tag restored successfully',
      };
    } catch (error) {
      logger.error(
        {
          scope: 'tag',
          tagId,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to restore tag',
      );
      return {
        success: false,
        message: 'Failed to restore tag',
      };
    }
  });

  ipcMain.handle(
    'tag:upsert',
    async (_event, payload: attribute.Tag[]): Promise<common.SuccessResponse> => {
      try {
        userDb.tag.transaction(() => {
          for (const tag of payload) {
            const parsed = attribute.TagSchema.parse(tag);
            userDb.tag.upsert(parsed);
            logger.info({ scope: 'tag', tagId: parsed.id }, 'Tag upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'tags',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info({ scope: 'audit', tagId: parsed.id }, 'Audit log created for tag upsert');
          }
        });
        return {
          success: true,
          message: 'Tags upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert tags',
        );
        return {
          success: false,
          message: 'Failed to upsert tags',
        };
      }
    },
  );

  ipcMain.handle(
    'tag:get-by-item-id',
    async (_event, itemId: string): Promise<Envelope<attribute.Tag[]>> => {
      try {
        const tags = userDb.tag.getByItemId(itemId);
        logger.info(
          { scope: 'tag', itemId, tagCount: tags?.length ?? 0 },
          'Tags retrieved by item ID successfully',
        );
        if (!tags || tags.length === 0) {
          return {
            success: true,
            message: 'No tags found for the given item ID',
            data: [],
          };
        }
        return {
          success: true,
          message: 'Tags retrieved successfully for the given item ID',
          data: tags,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'tag',
            itemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve tags for the given item ID',
        );
        return {
          success: false,
          message: 'Failed to retrieve tags for the given item ID',
        };
      }
    },
  );
}
