import { ipcMain } from 'electron';
import { system, common } from '@nias/shared';
import { slugify, logger, type Envelope } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from './audit';

export function registerProjectIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('project:list-active', async (_event): Promise<Envelope<system.Project[]>> => {
    try {
      const projects = userDb.project.listActive();
      logger.info(
        { scope: 'project', projectCount: projects.length },
        'Active projects retrieved successfully',
      );
      return {
        success: true,
        message: 'Active projects retrieved successfully',
        data: projects,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'project',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve active projects',
      );
      return {
        success: false,
        message: 'Failed to retrieve active projects',
      };
    }
  });

  ipcMain.handle('project:list-deleted', async (_event): Promise<Envelope<system.Project[]>> => {
    try {
      const projects = userDb.project.listDeleted();
      logger.info(
        { scope: 'project', projectCount: projects.length },
        'Deleted projects retrieved successfully',
      );
      return {
        success: true,
        message: 'Deleted projects retrieved successfully',
        data: projects,
      };
    } catch (error) {
      logger.error(
        {
          scope: 'project',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to retrieve deleted projects',
      );
      return {
        success: false,
        message: 'Failed to retrieve deleted projects',
      };
    }
  });

  ipcMain.handle(
    'project:get-by-id',
    async (_event, projectId: string): Promise<Envelope<system.Project | null>> => {
      try {
        const project = userDb.project.getById(projectId);
        if (!project) {
          logger.error({ scope: 'project', projectId }, 'Project not found');
          return {
            success: false,
            message: 'Project not found',
          };
        }
        logger.info({ scope: 'project', projectId }, 'Project retrieved successfully');
        return {
          success: true,
          message: 'Project retrieved successfully',
          data: project,
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            projectId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to retrieve project',
        );
        return {
          success: false,
          message: 'Failed to retrieve project',
        };
      }
    },
  );

  ipcMain.handle(
    'project:create',
    async (_event, payload: system.CreateProjectInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.CreateProjectInputSchema.parse(payload);

        const data: system.CreateProject = {
          id: crypto.randomUUID(),
          name: parsed.name,
          normalizedName: slugify(parsed.name)!,
          poNumber: parsed.poNumber || null,
          soNumber: parsed.soNumber || null,
        };

        userDb.project.create(data);
        logger.info({ scope: 'project', projectId: data.id }, 'Project created successfully');

        createAuditLog(userDb, userId, {
          action: 'create',
          tableName: 'projects',
          recordId: data.id,
          recordName: data.name,
        });
        logger.info(
          { scope: 'audit', projectId: data.id },
          'Audit log created for project creation',
        );

        return {
          success: true,
          message: 'Project created successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to create project',
        );
        return {
          success: false,
          message: 'Failed to create project',
        };
      }
    },
  );

  ipcMain.handle(
    'project:update',
    async (_event, payload: system.UpdateProjectInput): Promise<common.SuccessResponse> => {
      try {
        const parsed = system.UpdateProjectInputSchema.parse(payload);
        const existing = userDb.project.getById(parsed.id);
        if (!existing) {
          logger.error({ scope: 'project', projectId: parsed.id }, 'Project not found for update');
          return {
            success: false,
            message: 'Project not found for update',
          };
        }

        const updatedData: system.UpdateProject = {
          id: parsed.id,
          name: parsed.name,
          normalizedName: slugify(parsed.name),
          poNumber: parsed.poNumber || null,
          soNumber: parsed.soNumber || null,
        };

        userDb.project.update(updatedData);
        logger.info({ scope: 'project', projectId: parsed.id }, 'Project updated successfully');

        createAuditLog(userDb, userId, {
          action: 'update',
          tableName: 'projects',
          recordName: parsed.name || existing.name,
          recordId: parsed.id,
        });
        logger.info(
          { scope: 'audit', projectId: parsed.id },
          'Audit log created for project update',
        );

        return {
          success: true,
          message: 'Project updated successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to update project',
        );
        return {
          success: false,
          message: 'Failed to update project',
        };
      }
    },
  );

  ipcMain.handle(
    'project:delete',
    async (_event, projectId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.project.getById(projectId);
        if (!existing) {
          logger.error({ scope: 'project', projectId }, 'Project not found for deletion');
          return {
            success: false,
            message: 'Project not found for deletion',
          };
        }
        userDb.project.delete(projectId);
        logger.info({ scope: 'project', projectId }, 'Project deleted successfully');

        createAuditLog(userDb, userId, {
          action: 'delete',
          tableName: 'projects',
          recordName: existing.name,
          recordId: projectId,
        });
        logger.info({ scope: 'audit', projectId }, 'Audit log created for project deletion');

        return {
          success: true,
          message: 'Project deleted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            projectId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to delete project',
        );
        return {
          success: false,
          message: 'Failed to delete project',
        };
      }
    },
  );

  ipcMain.handle(
    'project:restore',
    async (_event, projectId: string): Promise<common.SuccessResponse> => {
      try {
        const existing = userDb.project.getById(projectId);
        if (!existing) {
          logger.error({ scope: 'project', projectId }, 'Project not found for restoration');
          return {
            success: false,
            message: 'Project not found for restoration',
          };
        }
        userDb.project.restore(projectId);
        logger.info({ scope: 'project', projectId }, 'Project restored successfully');

        createAuditLog(userDb, userId, {
          action: 'restore',
          tableName: 'projects',
          recordName: existing.name,
          recordId: projectId,
        });
        logger.info({ scope: 'audit', projectId }, 'Audit log created for project restoration');

        return {
          success: true,
          message: 'Project restored successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            projectId,
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to restore project',
        );
        return {
          success: false,
          message: 'Failed to restore project',
        };
      }
    },
  );

  ipcMain.handle(
    'project:upsert',
    async (_event, payload: system.Project[]): Promise<common.SuccessResponse> => {
      try {
        userDb.project.transaction(() => {
          for (const project of payload) {
            const parsed = system.ProjectSchema.parse(project);
            userDb.project.upsert(parsed);
            logger.info(
              { scope: 'project', projectId: parsed.id },
              'Project upserted successfully',
            );

            createAuditLog(userDb, userId, {
              action: 'upsert',
              tableName: 'projects',
              recordName: parsed.name,
              recordId: parsed.id,
            });
            logger.info(
              { scope: 'audit', projectId: parsed.id },
              'Audit log created for project upsert',
            );
          }
        });
        return {
          success: true,
          message: 'Projects upserted successfully',
        };
      } catch (error) {
        logger.error(
          {
            scope: 'project',
            errorMessage: (error as Error).message,
            errorStack: (error as Error).stack,
            rawError: error,
          },
          'Failed to upsert projects',
        );
        return {
          success: false,
          message: 'Failed to upsert projects',
        };
      }
    },
  );
}
