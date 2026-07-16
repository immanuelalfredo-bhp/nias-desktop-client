import type Database from 'better-sqlite3-multiple-ciphers';
import { ipcMain } from 'electron';
import { z } from 'zod';
import { system, common } from '@nias/shared';
import { logger } from '@nias/shared/server';
import type { UserDatabase } from './db/database';

export abstract class BaseQueries<T, CreateParams, UpdateParams> {
  constructor(
    protected readonly db: Database.Database,
    protected readonly tableName: string,
    protected readonly columns: string,
  ) {}

  listActive(): T[] {
    return this.db
      .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE deleted_at IS NULL`)
      .all() as T[];
  }

  listDeleted(): T[] {
    return this.db
      .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE deleted_at IS NOT NULL`)
      .all() as T[];
  }

  getById(id: string): T | null {
    return (
      (this.db
        .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE id = ?`)
        .get(id) as T) || null
    );
  }

  delete(id: string): void {
    this.db
      .prepare(`UPDATE ${this.tableName} SET deleted_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), id);
  }

  restore(id: string): void {
    this.db.prepare(`UPDATE ${this.tableName} SET deleted_at = NULL WHERE id = ?`).run(id);
  }

  // Abstract methods to be implemented by child classes
  abstract create(params: CreateParams): void;
  abstract update(params: UpdateParams): void;
  abstract upsert(params: T): void;
}

interface GenericIpcActions {
  listActive?: boolean;
  listDeleted?: boolean;
  getById?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  restore?: boolean;
}

interface GenericIpcOverrides<TCreate, TUpdate, TId> {
  actions?: GenericIpcActions;
  listActive?: () => unknown | Promise<unknown>;
  listDeleted?: () => unknown | Promise<unknown>;
  getById?: (id: string) => unknown | Promise<unknown>;
  create?: (payload: TCreate) => common.SuccessResponse | Promise<common.SuccessResponse>;
  update?: (payload: TUpdate) => common.SuccessResponse | Promise<common.SuccessResponse>;
  delete?: (payload: TId) => common.SuccessResponse | Promise<common.SuccessResponse>;
  restore?: (payload: TId) => common.SuccessResponse | Promise<common.SuccessResponse>;
}

function isActionEnabled(actions: GenericIpcActions | undefined, key: keyof GenericIpcActions): boolean {
  return actions?.[key] ?? true;
}

function extractEntityId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('id' in payload)) {
    return null;
  }

  const { id } = payload as { id?: unknown };
  return typeof id === 'string' ? id : null;
}

export function registerGenericIpcHandlers<
  TCreate,
  TUpdate extends { id: string },
  TId extends { id: string },
>(
  namespace: string,
  repo: any,
  schemas: {
    create: z.ZodSchema<TCreate>;
    update: z.ZodSchema<TUpdate>;
    id: z.ZodSchema<TId>;
  },
  resolveEntityName: (id: string) => string,
  resolveUserName: () => string,
  onAudit: (action: string, id: string, details: string) => void,
  overrides: GenericIpcOverrides<TCreate, TUpdate, TId> = {},
) {
  if (isActionEnabled(overrides.actions, 'listActive')) {
    ipcMain.handle(`${namespace}:list-active`, async () => {
      const data = overrides.listActive ? await overrides.listActive() : repo.listActive();
      return { success: true, data };
    });
  }

  if (isActionEnabled(overrides.actions, 'listDeleted')) {
    ipcMain.handle(`${namespace}:list-deleted`, async () => {
      const data = overrides.listDeleted ? await overrides.listDeleted() : repo.listDeleted();
      return { success: true, data };
    });
  }

  if (isActionEnabled(overrides.actions, 'getById')) {
    ipcMain.handle(`${namespace}:get-by-id`, async (_e, id: string) => ({
      success: true,
      data: overrides.getById ? await overrides.getById(id) : repo.getById(id),
    }));
  }

  const performAudit = (action: string, id: string, entityName: string) => {
    const userName = resolveUserName();
    const details = `${userName} ${action}ed ${entityName}`;
    onAudit(action, id, details);
  };

  if (isActionEnabled(overrides.actions, 'create')) {
    ipcMain.handle(`${namespace}:create`, async (_e, payload) => {
      const parsed = schemas.create.safeParse(payload);
      if (!parsed.success) return { success: false, message: 'Invalid payload' };

      const result = overrides.create
        ? await overrides.create(parsed.data)
        : (() => {
            repo.create(parsed.data);
            return { success: true, message: 'Created successfully' };
          })();

      if (!result.success) {
        return result;
      }

      if (!overrides.create) {
        const entityId = extractEntityId(parsed.data);
        if (entityId) {
          performAudit('create', entityId, resolveEntityName(entityId));
        }
      }

      return result;
    });
  }

  if (isActionEnabled(overrides.actions, 'update')) {
    ipcMain.handle(`${namespace}:update`, async (_e, payload) => {
      const parsed = schemas.update.safeParse(payload);
      if (!parsed.success) return { success: false, message: 'Invalid payload' };

      const result = overrides.update
        ? await overrides.update(parsed.data)
        : (() => {
            repo.update(parsed.data);
            performAudit('update', parsed.data.id, resolveEntityName(parsed.data.id));
            return { success: true, message: 'Updated successfully' };
          })();

      return result;
    });
  }

  const toggle =
    (isDelete: boolean) =>
    async (_e: unknown, payload: unknown): Promise<common.SuccessResponse> => {
      const parsed = schemas.id.safeParse(payload);
      if (!parsed.success) return { success: false, message: 'Invalid payload' };

      const entityName = resolveEntityName(parsed.data.id);
      const handler = isDelete ? overrides.delete : overrides.restore;
      if (handler) {
        return handler(parsed.data);
      }

      if (isDelete) {
        repo.delete(parsed.data.id);
      } else {
        repo.restore(parsed.data.id);
      }

      performAudit(isDelete ? 'delete' : 'restore', parsed.data.id, entityName);
      return { success: true, message: `${isDelete ? 'Deleted' : 'Restored'} successfully` };
    };

  if (isActionEnabled(overrides.actions, 'delete')) {
    ipcMain.handle(`${namespace}:delete`, toggle(true));
  }

  if (isActionEnabled(overrides.actions, 'restore')) {
    ipcMain.handle(`${namespace}:restore`, toggle(false));
  }
}

export function createAuditLog(
  userDb: UserDatabase,
  userId: string,
  payload: system.CreateAuditInput,
): common.SuccessResponse {
  try {
    const actor = userDb.user.getById(userId);
    if (!actor) {
      logger.error(
        {
          scope: 'audit',
          userId: userId,
        },
        'Failed to create audit log: Acting user not found. Sync user data.',
      );
      return {
        success: false,
        message: 'Failed to create audit log: Acting user not found. Sync user data.',
      };
    }

    const newAuditLog: system.CreateAudit = {
      id: crypto.randomUUID(),
      userId: userId,
      action: payload.action,
      tableName: payload.tableName,
      recordId: payload.recordId,
      timestamp: new Date().toISOString(),
      details: payload.details,
    };

    userDb.audit.createAuditLog(newAuditLog);
    logger.info({ scope: 'audit', auditLogId: newAuditLog.id }, 'Audit log created successfully');
    return { success: true, message: 'Audit log created successfully' };
  } catch (error) {
    logger.error(
      {
        scope: 'audit',
        err: error,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      'Failed to create audit log',
    );
    return { success: false, message: 'Failed to create audit log' };
  }
}
