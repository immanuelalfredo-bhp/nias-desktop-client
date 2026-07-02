import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is executing!');

contextBridge.exposeInMainWorld('electronAPI', {
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: { username: string; password: string }) => ipcRenderer.invoke('auth:login', payload),
  authFetchUser: (username: string, password: string) => ipcRenderer.invoke('auth:fetch-user', username, password),
  authSyncUsers: () => ipcRenderer.invoke('auth:sync-users'),
  bootstrapStatus: (secret: string) => ipcRenderer.invoke('bootstrap:status', secret),
  bootstrapExecute: (secret: string, payload: any) => ipcRenderer.invoke('bootstrap:execute', secret, payload),
});