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
});
