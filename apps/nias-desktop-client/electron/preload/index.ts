import { contextBridge, ipcRenderer } from 'electron';
import { auth, system } from '@nias/shared';

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
});
