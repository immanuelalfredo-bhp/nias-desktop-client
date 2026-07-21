import {
  serverUsers,
  syncMetadata,
  syncChanges,
  SYNC_TABLE_MAP,
} from './server/schema/server.js';
import { users } from './server/schema/system.js';

const syncedSchemas = Object.fromEntries(SYNC_TABLE_MAP.map(({ key, table }) => [key, table]));

export { serverUsers, syncMetadata, syncChanges, SYNC_TABLE_MAP, users };
export const schemas = {
  serverUsers,
  syncMetadata,
  syncChanges,
  ...syncedSchemas,
};

export * from './server/utils.js';
export * from './server/logger.js';
