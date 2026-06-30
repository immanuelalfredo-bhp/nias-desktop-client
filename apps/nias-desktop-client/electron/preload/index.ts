import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is executing!');

contextBridge.exposeInMainWorld('electronAPI', {
  authStatus: () => ipcRenderer.invoke('auth:status'),
  bootstrapStatus: (data: any) => ipcRenderer.invoke('bootstrap:status', data),
  bootstrapExecute: (data: any) => ipcRenderer.invoke('bootstrap:execute', data),
});