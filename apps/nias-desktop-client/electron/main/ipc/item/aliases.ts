import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerAliasIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('alias:list-active', async (_event): Promise<Envelope<item.Alias[]>> => {
    try {
      const aliases = userDb.alias.listActive();
      logger.info(
        { scope: 'alias', aliasCount: aliases.length },
        'Active aliases retrieved successfully',
      );
      return {
        success: true,
        message: 'Active aliases retrieved successfully',
        data: aliases,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'alias',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve active aliases',
      );
      return {
        success: false,
        message: 'Failed to retrieve active aliases',
      };
    }
  });

  ipcMain.handle('alias:list-deleted', async (_event): Promise<Envelope<item.Alias[]>> => {
    try {
      const aliases = userDb.alias.listDeleted();
      logger.info(
        { scope: 'alias', aliasCount: aliases.length },
        'Deleted aliases retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted aliases retrieved successfully',
        data: aliases,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'alias',
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Failed to retrieve deleted aliases',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted aliases',
      };
    }
  });

  ipcMain.handle(
    'alias:get-by-id',
    async (_event, aliasId: string): Promise<Envelope<item.Alias | null>> => {
      try {
        const alias = userDb.alias.getById(aliasId);
        if (!alias) {
          logger.error({ scope: 'alias', aliasId }, 'Alias not found');
          return {
            success: false,
            message: 'Alias not found',
          };
        }
        logger.info({ scope: 'alias', aliasId }, 'Alias retrieved successfully');
        return {
          success: true,
          message: 'Alias retrieved successfully',
          data: alias,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            aliasId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve alias',
        );
        return {
          success: false,
          message: 'Failed to retrieve alias',
        };
      }
    },
  );

  ipcMain.handle(
    'alias:create',
    async (_event, payload: item.CreateAliasInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateAliasInputSchema.parse(payload);

        const data: item.CreateAlias = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          alias: parsed.alias,
          normalizedAlias: slugify(parsed.alias)!,
        };

        userDb.alias.create(data);
        logger.info({ scope: 'alias', aliasId: data.id }, 'Alias created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'aliases',
          recordId: data.id,
          recordName: data.alias,
        });
        logger.info({ scope: 'audit', aliasId: data.id }, 'Audit log created for alias creation');

        return {
          success: true,
          message: 'Alias created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create alias',
        );
        return {
          success: false,
          message: 'Failed to create alias',
        };
      }
    },
  );

  ipcMain.handle(
    'alias:update',
    async (_event, payload: item.UpdateAliasInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateAliasInputSchema.parse(payload);
        const existing = userDb.alias.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'alias', aliasId: parsed.id }, 'Alias not found for update');
          return {
            success: false,
            message: 'Alias not found for update',
          };
        }

        const updatedData: item.UpdateAlias = {
          id: parsed.id,
          itemId: parsed.itemId,
          alias: parsed.alias,
          normalizedAlias: slugify(parsed.alias),
        };

        userDb.alias.update(updatedData);
        logger.info({ scope: 'alias', aliasId: parsed.id }, 'Alias updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'aliases',
          recordName: parsed.alias || existing.alias,
          recordId: parsed.id,
        });
        logger.info({ scope: 'audit', aliasId: parsed.id }, 'Audit log created for alias update');

        return {
          success: true,
          message: 'Alias updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update alias',
        );
        return {
          success: false,
          message: 'Failed to update alias',
        };
      }
    },
  );

  ipcMain.handle(
    'alias:delete',
    async (_event, aliasId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.alias.getById(aliasId);
        if (!existing) {
          logger.error({ scope: 'alias', aliasId }, 'Alias not found for deletion');
          return {
            success: false,
            message: 'Alias not found for deletion',
          };
        }
        userDb.alias.delete(aliasId);
        logger.info({ scope: 'alias', aliasId }, 'Alias deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'aliases',
          recordName: existing.alias,
          recordId: aliasId,
        });
        logger.info({ scope: 'audit', aliasId }, 'Audit log created for alias deletion');

        return {
          success: true,
          message: 'Alias deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            aliasId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete alias',
        );
        return {
          success: false,
          message: 'Failed to delete alias',
        };
      }
    },
  );

  ipcMain.handle(
    'alias:restore',
    async (_event, aliasId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.alias.getById(aliasId);
        if (!existing) {
          logger.error({ scope: 'alias', aliasId }, 'Alias not found for restoration');
          return {
            success: false,
            message: 'Alias not found for restoration',
          };
        }
        userDb.alias.restore(aliasId);
        logger.info({ scope: 'alias', aliasId }, 'Alias restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'aliases',
          recordName: existing.alias,
          recordId: aliasId,
        });
        logger.info({ scope: 'audit', aliasId }, 'Audit log created for alias restoration');

        return {
          success: true,
          message: 'Alias restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            aliasId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore alias',
        );
        return {
          success: false,
          message: 'Failed to restore alias',
        };
      }
    },
  );

  ipcMain.handle(
    'alias:upsert',
    async (_event, payload: item.Alias[]): Promise<common.SuccessResponse> => {
      try {
        userDb.alias.transaction(() => {
          for (const alias of payload) {
            const parsed = item.AliasSchema.parse(alias);
            userDb.alias.upsert(parsed);
            logger.info({ scope: 'alias', aliasId: parsed.id }, 'Alias upserted successfully');

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'aliases',
              recordName: parsed.alias,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', aliasId: parsed.id },
              'Audit log created for alias upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Aliases upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'alias',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert aliases',
        );
        return {
          success: false,
          message: 'Failed to upsert aliases',
        };
      }
    },
  );
}
