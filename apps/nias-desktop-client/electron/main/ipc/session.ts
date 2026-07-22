import { ipcMain } from 'electron';
import { AuthDatabase, UserDatabase } from '../db/database.js';

// System IPC handlers
import { registerAuditIpcHandlers } from './system/audit.js';
import { registerUserIpcHandlers } from './system/users.js';
import { registerRoleIpcHandlers } from './system/roles.js';
import { registerProjectIpcHandlers } from './system/projects.js';
import { registerRoleCapabilitiesIpcHandlers } from './system/role-capabilities.js';
import { registerRoleManagementIpcHandlers } from './system/role-management.js';
import { registerRoleMapsIpcHandlers } from './system/role-maps.js';
import { registerProjectMapsIpcHandlers } from './system/project-maps.js';

// Attribute IPC handlers
import { registerBrandIpcHandlers } from './attribute/brands.js';
import { registerModeIpcHandlers } from './attribute/modes.js';
import { registerUomIpcHandlers } from './attribute/uoms.js';
import { registerDimensionsIpcHandlers } from './attribute/dimensions.js';
import { registerDimensionValuesIpcHandlers } from './attribute/dimension-values.js';
import { registerSystemIpcHandlers } from './attribute/systems.js';
import { registerCategoryIpcHandlers } from './attribute/categories.js';
import { registerVendorIpcHandlers } from './attribute/vendors.js';
import { registerTagIpcHandlers } from './attribute/tags.js';

// Item IPC handlers
import { registerItemRecordsIpcHandlers } from './item/item-records.js';
import { registerAliasIpcHandlers } from './item/aliases.js';
import { registerBrandlineMapsIpcHandlers } from './item/brandline-maps.js';
import { registerDimensionMapsIpcHandlers } from './item/dimension-maps.js';
import { registerSystemMapsIpcHandlers } from './item/system-maps.js';
import { registerTagMapsIpcHandlers } from './item/tag-maps.js';
import { registerVendorMapsIpcHandlers } from './item/vendor-maps.js';
import { registerGenerationRulesIpcHandlers } from './item/generation-rules.js';

// Variant IPC handlers
import { registerVariantRecordsIpcHandlers } from './variant/variant-records.js';
import { registerDimensionValueMapsIpcHandlers } from './variant/dimension-value-maps.js';
import { registerComponentMapsIpcHandlers } from './variant/component-maps.js';
import { registerSwitchMapsIpcHandlers } from './variant/switch-maps.js';
import { registerVendorPriceIpcHandlers } from './variant/vendor-prices.js';

// Order IPC handlers
import { registerRequestIpcHandlers } from './order/requests.js';
import { registerRequestItemIpcHandlers } from './order/request-items.js';

// Other IPC handlers
import { registerSyncIpcHandlers } from './sync.js';

const sessionChannels = new Set<string>();

function trackSessionChannelRegistrations(registerAll: () => void): void {
  const originalHandle = ipcMain.handle.bind(ipcMain);
  const trackedHandle: typeof ipcMain.handle = ((channel, listener) => {
    sessionChannels.add(channel);
    return originalHandle(channel, listener);
  }) as typeof ipcMain.handle;

  (ipcMain as unknown as { handle: typeof ipcMain.handle }).handle = trackedHandle;
  try {
    registerAll();
  } finally {
    (ipcMain as unknown as { handle: typeof ipcMain.handle }).handle = originalHandle;
  }
}

export function unregisterSessionIpcHandlers(): void {
  for (const channel of sessionChannels) {
    ipcMain.removeHandler(channel);
  }
  sessionChannels.clear();
}

export function registerSessionIpcHandlers(authDb: AuthDatabase, userDb: UserDatabase, userId: string): void {
  unregisterSessionIpcHandlers();

  trackSessionChannelRegistrations(() => {
    // System IPC handlers
    registerAuditIpcHandlers(userDb);
    registerUserIpcHandlers(authDb, userDb, userId);
    registerRoleIpcHandlers(userDb, userId);
    registerProjectIpcHandlers(userDb, userId);
    registerRoleCapabilitiesIpcHandlers(userDb, userId);
    registerRoleManagementIpcHandlers(userDb, userId);
    registerRoleMapsIpcHandlers(userDb, userId);
    registerProjectMapsIpcHandlers(userDb, userId);

    // Attribute IPC handlers
    registerBrandIpcHandlers(userDb, userId);
    registerModeIpcHandlers(userDb, userId);
    registerUomIpcHandlers(userDb, userId);
    registerDimensionsIpcHandlers(userDb, userId);
    registerDimensionValuesIpcHandlers(userDb, userId);
    registerSystemIpcHandlers(userDb, userId);
    registerCategoryIpcHandlers(userDb, userId);
    registerVendorIpcHandlers(userDb, userId);
    registerTagIpcHandlers(userDb, userId);

    // Item IPC handlers
    registerItemRecordsIpcHandlers(userDb, userId);
    registerAliasIpcHandlers(userDb, userId);
    registerBrandlineMapsIpcHandlers(userDb, userId);
    registerDimensionMapsIpcHandlers(userDb, userId);
    registerSystemMapsIpcHandlers(userDb, userId);
    registerTagMapsIpcHandlers(userDb, userId);
    registerVendorMapsIpcHandlers(userDb, userId);
    registerGenerationRulesIpcHandlers(userDb, userId);

    // Variant IPC handlers
    registerVariantRecordsIpcHandlers(userDb, userId);
    registerDimensionValueMapsIpcHandlers(userDb, userId);
    registerComponentMapsIpcHandlers(userDb, userId);
    registerSwitchMapsIpcHandlers(userDb, userId);
    registerVendorPriceIpcHandlers(userDb, userId);

    // Order IPC handlers
    registerRequestIpcHandlers(userDb, userId);
    registerRequestItemIpcHandlers(userDb, userId);

    // Other IPC handlers
    registerSyncIpcHandlers(authDb, userDb, userId);
  });
}