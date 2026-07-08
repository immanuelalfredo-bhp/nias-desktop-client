import { contextBridge, ipcRenderer } from 'electron';
import { auth } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {

  // Authentication IPC handlers
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: auth.LoginCredentials) =>
    ipcRenderer.invoke('auth:login', payload),
  authSync: () => ipcRenderer.invoke('auth:sync'),

  // Bootstrap IPC handlers
  bootstrapStatus: (bootstrapSecret: string) =>
    ipcRenderer.invoke('bootstrap:status', bootstrapSecret),
  bootstrapExecute: (bootstrapSecret: string, payload: auth.BootstrapPayload) =>
    ipcRenderer.invoke('bootstrap:execute', bootstrapSecret, payload),
});