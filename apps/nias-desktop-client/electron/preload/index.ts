import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is executing!');

contextBridge.exposeInMainWorld('electronAPI', {
  authStatus: () => ipcRenderer.invoke('auth:status'),
  bootstrapStatus: (secret: string) => ipcRenderer.invoke('bootstrap:status', secret),
  bootstrapExecute: (secret: string, payload: any) => ipcRenderer.invoke('bootstrap:execute', secret, payload),
});