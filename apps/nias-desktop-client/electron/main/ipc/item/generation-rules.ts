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
          'Active generation rules retrieved successfully',
        );
        return {
          success: true,
          message: 'Active generation rules retrieved successfully',
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
          'Failed to retrieve active generation rules',
        );
        return {
          success: false,
          message: 'Failed to retrieve active generation rules',
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
          'Deleted generation rules retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted generation rules retrieved successfully',
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
          'Failed to retrieve deleted generation rules',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted generation rules',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:list-dirty-components',
    async (_event, itemId: string): Promise<Envelope<item.GenerationRules[]>> => {
      try {
        const dirtyComponents = userDb.generationRules.listDirtyComponents();
        return {
          success: true,
          message: 'Retrieved dirty component generation rules successfully',
          data: dirtyComponents,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            itemId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve dirty component generation rules',
        );
        return {
          success: false,
          message: 'Failed to retrieve dirty component generation rules',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:get-by-id',
    async (_event, generationRuleId: string): Promise<Envelope<item.GenerationRules>> => {
      try {
        const generationRule = userDb.generationRules.getById(generationRuleId);
        if (!generationRule) {
          logger.error({ scope: 'generation-rule', generationRuleId }, 'Generation rule not found');
          return {
            success: false,
            message: 'Generation rule not found',
          };
        }
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Generation rule retrieved successfully',
        );
        return {
          success: true,
          message: 'Generation rule retrieved successfully',
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
          'Failed to retrieve generation rule',
        );
        return {
          success: false,
          message: 'Failed to retrieve generation rule',
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
          'Generation rule created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'generation_rules',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', generationRuleId: data.id },
          'Audit log created for generation rule creation',
        );

        return {
          success: true,
          message: 'Generation rule created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create generation rule',
        );
        return {
          success: false,
          message: 'Failed to create generation rule',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:update',
    async (_event, payload: item.UpdateGenerationRule): Promise<common.SuccessResponse> => {
      try {
        const parsed = item.UpdateGenerationRuleSchema.parse(payload);
        const existing = userDb.generationRules.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId: parsed.id },
            'Generation rule not found for update',
          );
          return {
            success: false,
            message: 'Generation rule not found for update',
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

        userDb.generationRules.update(updatedData);
        logger.info(
          { scope: 'generation-rule', generationRuleId: parsed.id },
          'Generation rule updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'generation_rules',
          recordName: parsed.id || existing.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', generationRuleId: parsed.id },
          'Audit log created for generation rule update',
        );

        return {
          success: true,
          message: 'Generation rule updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update generation rule',
        );
        return {
          success: false,
          message: 'Failed to update generation rule',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:delete',
    async (_event, generationRuleId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.generationRules.getById(generationRuleId);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId },
            'Generation rule not found for deletion',
          );
          return {
            success: false,
            message: 'Generation rule not found for deletion',
          };
        }
        userDb.generationRules.delete(generationRuleId);
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Generation rule deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'generation_rules',
          recordName: generationRuleId,
          recordId: generationRuleId,
        });
        logger.info(
          { scope: 'audit', generationRuleId },
          'Audit log created for generation rule deletion',
        );

        return {
          success: true,
          message: 'Generation rule deleted successfully',
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
          'Failed to delete generation rule',
        );
        return {
          success: false,
          message: 'Failed to delete generation rule',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:restore',
    async (_event, generationRuleId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.generationRules.getById(generationRuleId);
        if (!existing) {
          logger.error(
            { scope: 'generation-rule', generationRuleId },
            'Generation rule not found for restoration',
          );
          return {
            success: false,
            message: 'Generation rule not found for restoration',
          };
        }
        userDb.generationRules.restore(generationRuleId);
        logger.info(
          { scope: 'generation-rule', generationRuleId },
          'Generation rule restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'generation_rules',
          recordName: generationRuleId,
          recordId: generationRuleId,
        });
        logger.info(
          { scope: 'audit', generationRuleId },
          'Audit log created for generation rule restoration',
        );

        return {
          success: true,
          message: 'Generation rule restored successfully',
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
          'Failed to restore generation rule',
        );
        return {
          success: false,
          message: 'Failed to restore generation rule',
        };
      }
    },
  );

  ipcMain.handle(
    'generation-rule:upsert',
    async (_event, payload: item.GenerationRules[]): Promise<common.SuccessResponse> => {
      try {
        userDb.generationRules.transaction(() => {
          for (const generationRule of payload) {
            const parsed = item.GenerationRulesSchema.parse(generationRule);
            userDb.generationRules.upsert(parsed);
            logger.info(
              { scope: 'generation-rule', generationRuleId: parsed.id },
              'Generation rule upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'generation_rules',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', generationRuleId: parsed.id },
              'Audit log created for generation rule upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Generation rules upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'generation-rule',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert generation rules',
        );
        return {
          success: false,
          message: 'Failed to upsert generation rules',
        };
      }
    },
  );

  ipcMain.handle('generation-rule:list-with-names', async (_event, isActive: boolean): Promise<Envelope<any[]>> => {
    try {
      const generationRulesWithNames = userDb.generationRules.listWithNames(isActive);
      logger.info(
        { scope: 'generation-rule', generationRuleCount: generationRulesWithNames.length },
        'Generation rules with names retrieved successfully',
      );
      return {
        success: true,
        message: 'Generation rules with names retrieved successfully',
        data: generationRulesWithNames,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'generation-rule',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve generation rules with names',
      );
      return {
        success: false,
        message: 'Failed to retrieve generation rules with names',
      };
    }
  });
}
