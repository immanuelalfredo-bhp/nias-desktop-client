import { contextBridge, ipcRenderer } from 'electron';
import type { BootstrapAccount, LoginCredentials } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: LoginCredentials) =>
    ipcRenderer.invoke('auth:login', payload),
  authFetchUser: (username: string, password: string) =>
    ipcRenderer.invoke('auth:fetch-user', username, password),
  authSyncUsers: () => ipcRenderer.invoke('auth:sync-users'),
  bootstrapStatus: (secret: string) => ipcRenderer.invoke('bootstrap:status', secret),
  bootstrapExecute: (secret: string, payload: BootstrapAccount) =>
    ipcRenderer.invoke('bootstrap:execute', secret, payload),
});