import type { BootstrapAccount, LoginCredentials } from '@nias/shared';

export interface ElectronAPI {
  authStatus: () => Promise<common.SuccessResponse & auth.AuthStatusResponse>;
  authLogin: (payload: LoginCredentials) => Promise<common.SuccessResponse>;
  authSync: () => Promise<common.SuccessResponse>;
  bootstrapStatus: (bootstrapSecret: string) => Promise<common.SuccessResponse & auth.AuthStatusResponse>;
  bootstrapExecute: (bootstrapSecret: string, payload: BootstrapAccount) => Promise<common.SuccessResponse>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';