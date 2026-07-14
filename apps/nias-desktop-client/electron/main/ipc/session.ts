import type { AuthDatabase, UserDatabase } from '../db/database.js';
import { registerAuditIpcHandlers } from './system/audit.js';
import { registerUserIpcHandlers } from './system/users.js';
import { registerSyncIpcHandlers } from './sync.js';
import {
  registerAttributeIpcHandlers,
} from './attribute.js';

export function registerUserSessionIpcHandlers(
  authDb: AuthDatabase,
  userDb: UserDatabase,
  userId: string,
): void {
  registerAuditIpcHandlers(userDb);
  registerSyncIpcHandlers(authDb, userDb, userId);
  registerUserIpcHandlers(authDb, userDb, userId);
  registerAttributeIpcHandlers(userDb, userId);
}