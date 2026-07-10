import { auth, common, sync } from '@nias/shared';
import type { Envelope } from '@nias/shared/server';

export interface ElectronAPI {
  authStatus: () => Promise<Envelope<auth.StatusResponse>>;
  authLogin: (payload: auth.LoginCredentials) => Promise<common.SuccessResponse>;
  authSync: () => Promise<common.SuccessResponse>;
  bootstrapStatus: (bootstrapSecret: string) => Promise<Envelope<auth.StatusResponse>>;
  bootstrapExecute: (
    bootstrapSecret: string,
    payload: auth.BootstrapInput,
  ) => Promise<common.SuccessResponse>;
  syncPull: () => Promise<Envelope<sync.PullManifest>>;
  userListActive: () => Promise<Envelope<system.User[]>>;
  userListDeleted: () => Promise<Envelope<system.User[]>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';
