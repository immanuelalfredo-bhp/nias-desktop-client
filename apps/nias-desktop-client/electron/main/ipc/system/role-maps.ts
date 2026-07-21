import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerProjectMapsIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle(
    'project-map:list-active',
    async (_event): Promise<Envelope<system.ProjectMap[]>> => {
      try {
        const projectMaps = userDb.projectMap.listActive();
        logger.info(
          { scope: 'project-map', projectMapCount: projectMaps.length },
          'Active project maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Active project maps retrieved successfully',
          data: projectMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve active project maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve active project maps',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:list-deleted',
    async (_event): Promise<Envelope<system.ProjectMap[]>> => {
      try {
        const projectMaps = userDb.projectMap.listDeleted();
        logger.info(
          { scope: 'project-map', projectMapCount: projectMaps.length },
          'Deleted project maps retrieved successfully',
        );
        return {
          success: true,
          message: 'Deleted project maps retrieved successfully',
          data: projectMaps,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve deleted project maps',
        );
        return {
          success: false,
          message: 'Failed to retrieve deleted project maps',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:get-by-id',
    async (_event, projectMapId: string): Promise<Envelope<system.ProjectMap | null>> => {
      try {
        const projectMap = userDb.projectMap.getById(projectMapId);
        if (!projectMap) {
          logger.error({ scope: 'project-map', projectMapId }, 'Project map not found');
          return {
            success: false,
            message: 'Project map not found',
          };
        }
        logger.info(
          { scope: 'project-map', projectMapId },
          'Project map retrieved successfully',
        );
        return {
          success: true,
          message: 'Project map retrieved successfully',
          data: projectMap,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            projectMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to retrieve project map',
        );
        return {
          success: false,
          message: 'Failed to retrieve project map',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:create',
    async (_event, payload: system.CreateProjectMapInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateProjectMapInputSchema.parse(payload);

        const data: system.CreateProjectMap = {
          id: crypto.randomUUID(),
          projectId: parsed.projectId,
          userId: parsed.userId,
        };

        userDb.projectMap.create(data);
        logger.info(
          { scope: 'project-map', projectMapId: data.id },
          'Project map created successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'project_maps',
          recordId: data.id,
          recordName: data.id,
        });
        logger.info(
          { scope: 'audit', projectMapId: data.id },
          'Audit log created for project map creation',
        );

        return {
          success: true,
          message: 'Project map created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to create project map',
        );
        return {
          success: false,
          message: 'Failed to create project map',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:update',
    async (_event, payload: system.UpdateProjectMap): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateProjectMapSchema.parse(payload);
        const existing = userDb.projectMap.getById(parsed.id);
        if (!existing) {
          logger.error(
            { scope: 'project-map', projectMapId: parsed.id },
            'Project map not found for update',
          );
          return {
            success: false,
            message: 'Project map not found for update',
          };
        }

        const updatedData: system.UpdateProjectMap = {
          id: parsed.id,
          projectId: parsed.projectId,
          userId: parsed.userId,
        };

        userDb.projectMap.update(updatedData);
        logger.info(
          { scope: 'project-map', projectMapId: parsed.id },
          'Project map updated successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'project_maps',
          recordName: parsed.id,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', projectMapId: parsed.id },
          'Audit log created for project map update',
        );

        return {
          success: true,
          message: 'Project map updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to update project map',
        );
        return {
          success: false,
          message: 'Failed to update project map',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:delete',
    async (_event, projectMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.projectMap.getById(projectMapId);
        if (!existing) {
          logger.error(
            { scope: 'project-map', projectMapId },
            'Project map not found for deletion',
          );
          return {
            success: false,
            message: 'Project map not found for deletion',
          };
        }
        userDb.projectMap.delete(projectMapId);
        logger.info(
          { scope: 'project-map', projectMapId },
          'Project map deleted successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'project_maps',
          recordName: projectMapId,
          recordId: projectMapId,
        });
        logger.info(
          { scope: 'audit', projectMapId },
          'Audit log created for project map deletion',
        );

        return {
          success: true,
          message: 'Project map deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            projectMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete project map',
        );
        return {
          success: false,
          message: 'Failed to delete project map',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:restore',
    async (_event, projectMapId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.projectMap.getById(projectMapId);
        if (!existing) {
          logger.error(
            { scope: 'project-map', projectMapId },
            'Project map not found for restoration',
          );
          return {
            success: false,
            message: 'Project map not found for restoration',
          };
        }
        userDb.projectMap.restore(projectMapId);
        logger.info(
          { scope: 'project-map', projectMapId },
          'Project map restored successfully',
        );

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'project_maps',
          recordName: projectMapId,
          recordId: projectMapId,
        });
        logger.info(
          { scope: 'audit', projectMapId },
          'Audit log created for project map restoration',
        );

        return {
          success: true,
          message: 'Project map restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            projectMapId,
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to restore project map',
        );
        return {
          success: false,
          message: 'Failed to restore project map',
        };
      }
    },
  );

  ipcMain.handle(
    'project-map:upsert',
    async (_event, payload: system.ProjectMap[]): Promise<common.SuccessResponse> => {
      try {
        userDb.projectMap.transaction(() => {
          for (const projectMap of payload) {
            const parsed = system.ProjectMapSchema.parse(projectMap);
            userDb.projectMap.upsert(parsed);
            logger.info(
              { scope: 'project-map', projectMapId: parsed.id },
              'Project map upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'project_maps',
              recordName: parsed.id,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', projectMapId: parsed.id },
              'Audit log created for project map upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Project maps upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project-map',
            err: error,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to upsert project maps',
        );
        return {
          success: false,
          message: 'Failed to upsert project maps',
        };
      }
    },
  );
}
