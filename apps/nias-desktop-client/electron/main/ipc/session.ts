import type { AuthDatabase, UserDatabase } from '../db/database.js';
import { registerAuditIpcHandlers } from './system/audit.js';
import { registerUserIpcHandlers } from './system/users.js';
import { registerSyncIpcHandlers } from './sync.js';
import {
  registerBrandIpcHandlers,
  registerDimensionIpcHandlers,
  registerDimensionValueIpcHandlers,
  registerModeIpcHandlers,
  registerUomIpcHandlers,
} from './attribute.js';

export function registerUserSessionIpcHandlers(
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void {
  registerAuditIpcHandlers(userDb);
  registerSyncIpcHandlers(authDb, userDb, userId);
  registerUserIpcHandlers(authDb, userDb, userId);
  registerBrandIpcHandlers(userDb, userId);
  registerModeIpcHandlers(userDb, userId);
  registerUomIpcHandlers(userDb, userId);
  registerDimensionIpcHandlers(userDb, userId);
  registerDimensionValueIpcHandlers(userDb, userId);
}