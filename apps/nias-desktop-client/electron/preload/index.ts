import { contextBridge, ipcRenderer } from 'electron';
import { attribute, auth, system } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication IPC handlers
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: auth.LoginCredentials) => ipcRenderer.invoke('auth:login', payload),
  authSync: () => ipcRenderer.invoke('auth:sync'),

  // Bootstrap IPC handlers
  bootstrapStatus: (bootstrapSecret: string) =>
    ipcRenderer.invoke('bootstrap:status', bootstrapSecret),
  bootstrapExecute: (bootstrapSecret: string, payload: auth.BootstrapInput) =>
    ipcRenderer.invoke('bootstrap:execute', bootstrapSecret, payload),

  // Sync IPC handlers
  syncPull: () => ipcRenderer.invoke('sync:pull'),

  // User IPC handlers
  userListActive: () => ipcRenderer.invoke('user:list-active'),
  userListDeleted: () => ipcRenderer.invoke('user:list-deleted'),
  userCreate: (payload: system.CreateUserInput) => ipcRenderer.invoke('user:create', payload),

  // Branding IPC handlers
  brandListActive: () => ipcRenderer.invoke('brand:list-active'),
  brandListDeleted: () => ipcRenderer.invoke('brand:list-deleted'),
  brandCreate: (payload: attribute.CreateBrandInput) => ipcRenderer.invoke('brand:create', payload),
  brandUpdate: (payload: attribute.UpdateBrandInput) => ipcRenderer.invoke('brand:update', payload),
  brandDelete: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:delete', payload),
  brandRestore: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:restore', payload),

  // Mode IPC handlers
  modeListActive: () => ipcRenderer.invoke('mode:list-active'),
  modeListDeleted: () => ipcRenderer.invoke('mode:list-deleted'),
  modeCreate: (payload: attribute.CreateModeInput) => ipcRenderer.invoke('mode:create', payload),
  modeUpdate: (payload: attribute.UpdateModeInput) => ipcRenderer.invoke('mode:update', payload),
  modeDelete: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:delete', payload),
  modeRestore: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:restore', payload),

  // UoM IPC handlers
  uomListActive: () => ipcRenderer.invoke('uom:list-active'),
  uomListDeleted: () => ipcRenderer.invoke('uom:list-deleted'),
  uomCreate: (payload: attribute.CreateUomInput) => ipcRenderer.invoke('uom:create', payload),
  uomUpdate: (payload: attribute.UpdateUomInput) => ipcRenderer.invoke('uom:update', payload),
  uomDelete: (payload: attribute.UomId) => ipcRenderer.invoke('uom:delete', payload),
  uomRestore: (payload: attribute.UomId) => ipcRenderer.invoke('uom:restore', payload),

  // Dimension IPC handlers
  dimensionListActive: () => ipcRenderer.invoke('dimension:list-active'),
  dimensionListDeleted: () => ipcRenderer.invoke('dimension:list-deleted'),
  dimensionCreate: (payload: attribute.CreateDimensionInput) =>
    ipcRenderer.invoke('dimension:create', payload),
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) =>
    ipcRenderer.invoke('dimension:update', payload),
  dimensionDelete: (payload: attribute.DimensionId) =>
    ipcRenderer.invoke('dimension:delete', payload),
  dimensionRestore: (payload: attribute.DimensionId) =>
    ipcRenderer.invoke('dimension:restore', payload),

  // Dimension Value IPC handlers
  dimensionValueListActive: () => ipcRenderer.invoke('dimension-value:list-active'),
  dimensionValueListDeleted: () => ipcRenderer.invoke('dimension-value:list-deleted'),
  dimensionValueCreate: (payload: attribute.CreateDimensionValue) =>
    ipcRenderer.invoke('dimension-value:create', payload),
  dimensionValueUpdate: (payload: attribute.UpdateDimensionValue) =>
    ipcRenderer.invoke('dimension-value:update', payload),
  dimensionValueDelete: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimension-value:delete', payload),
  dimensionValueRestore: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimension-value:restore', payload),
});
