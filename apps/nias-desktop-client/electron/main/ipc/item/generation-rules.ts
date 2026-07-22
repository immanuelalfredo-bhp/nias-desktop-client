import { ipcMain } from 'electron';
import { item, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerGenerationRulesIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'generation-rule:list-active',
    async (_event): Promise<Envelope<item.GenerationRules[]>> => {
      try {
        const generationRules = userDb.generationRules.listActive();
        logger.info(
          { scope: 'generation-rule', generationRuleCount: generationRules.length },
          'Active item records retrieved successfully',
        );
        return {
          success: true,
          message: 'Active item records retrieved successfully',
          data: generationRules,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve active item records',
        );
        return {
          success: false,
          message: 'Failed to retrieve active item records',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:list-deleted',
    async (_event): Promise<Envelope<item.GenerationRules[]>> => {
      try {
        const generationRules = userDb.generationRules.listDeleted();
        logger.info(
          { scope: 'generation-rule', generationRuleCount: generationRules.length },
          'Deleted item records retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted item records retrieved successfully',
          data: generationRules,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve deleted item records',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted item records',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:get-by-id',
    async (_event, generationRuleId: string): Promise<Envelope<item.GenerationRules | null>> => {
      try {
        const generationRule = userDb.generationRules.getById(generationRuleId);
        if (!generationRule) {
          logger.error({ scope: 'generation-rule', generationRuleId }, 'Dimension value not found');
          return {
            success: false,
            message: 'Dimension value not found',
          };
        }
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Dimension value retrieved successfully',
        );
        return {
          success: true,
          message: 'Dimension value retrieved successfully',
          data: generationRule,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            generationRuleId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve item record',
        );
        return {
          success: false,
          message: 'Failed to retrieve item record',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:create',
    async (_event, payload: item.CreateGenerationRuleInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.CreateGenerationRuleInputSchema.parse(payload);

        const data: item.CreateGenerationRule = {
          id: crypto.randomUUID(),
          itemId: parsed.itemId,
          brandId: parsed.brandId,
          categoryId: parsed.categoryId,
          modeId: parsed.modeId,
          uomId: parsed.uomId,
          rules: parsed.rules,
          isDirty: true,
        };

        userDb.generationRules.create(data);
        logger.info(
          { scope: 'generation-rule', generationRuleId: data.id },
          'Item record created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'item_records',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', generationRuleId: data.id },
          'Audit log created for item record creation',
        );

        return {
          success: true,
          message: 'Item record created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create item record',
        );
        return {
          success: false,
          message: 'Failed to create item record',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:update',
    async (_event, payload: item.UpdateGenerationRule): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateGenerationRuleSchema.parse(payload);
        const existing = userDb.item.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId: parsed.id },
            'Item record not found for update',
          );
          return {
            success: false,
            message: 'Item record not found for update',
          };
        }

        const updatedData: item.UpdateGenerationRule = {
          id: parsed.id,
          itemId: parsed.itemId,
          brandId: parsed.brandId,
          categoryId: parsed.categoryId,
          modeId: parsed.modeId,
          uomId: parsed.uomId,
          rules: parsed.rules,
          isDirty: true,
        };

        userDb.item.update(updatedData);
        logger.info(
          { scope: 'generation-rule', generationRuleId: parsed.id },
          'Item record updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'item_records',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', generationRuleId: parsed.id },
          'Audit log created for item record update',
        );

        return {
          success: true,
          message: 'Item record updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update item record',
        );
        return {
          success: false,
          message: 'Failed to update item record',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:delete',
    async (_event, generationRuleId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.item.getById(generationRuleId);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId },
            'Item record not found for deletion',
          );
          return {
            success: false,
            message: 'Item record not found for deletion',
          };
        }
        userDb.item.delete(generationRuleId);
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Item record deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'item_records',
          recordName: existing.displayName,
          recordId: generationRuleId,
        });
        logger.info(
          { scope: 'audit', generationRuleId },
          'Audit log created for item record deletion',
        );

        return {
          success: true,
          message: 'Item record deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            generationRuleId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete item record',
        );
        return {
          success: false,
          message: 'Failed to delete item record',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:restore',
    async (_event, generationRuleId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.item.getById(generationRuleId);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId },
            'Item record not found for restoration',
          );
          return {
            success: false,
            message: 'Item record not found for restoration',
          };
        }
        userDb.item.restore(generationRuleId);
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Item record restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'item_records',
          recordName: existing.displayName,
          recordId: generationRuleId,
        });
        logger.info(
          { scope: 'audit', generationRuleId },
          'Audit log created for item record restoration',
        );

        return {
          success: true,
          message: 'Item record restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            generationRuleId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore item record',
        );
        return {
          success: false,
          message: 'Failed to restore item record',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:upsert',
    async (_event, payload: item.GenerationRules[]): Promise<common.SuccessResponse> => {
      try {
        userDb.item.transaction(() => {
          for (const generationRule of payload) {
            const parsed = item.GenerationRulesSchema.parse(generationRule);
            userDb.generationRules.upsert(parsed);
            logger.info(
              { scope: 'generation-rule', generationRuleId: parsed.id },
              'Item record upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'item_records',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', generationRuleId: parsed.id },
              'Audit log created for item record upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Item records upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert item records',
        );
        return {
          success: false,
          message: 'Failed to upsert item records',
        };
      }
    },
  );
}
