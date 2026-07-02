import type { BootstrapAccount, LoginCredentials } from '@nias/shared';

interface AuthStatusResult {
  isEmpty: boolean;
}

interface IpcResult {
  success: boolean;
  message?: string;
}

interface BootstrapStatusResult extends IpcResult {
  isEmpty: boolean;
  isValid: boolean;
}

export interface ElectronAPI {
  authStatus: () => Promise<AuthStatusResult>;
  authLogin: (payload: LoginCredentials) => Promise<IpcResult>;
  authFetchUser: (username: string, password: string) => Promise<IpcResult>;
  authSyncUsers: () => Promise<IpcResult>;
  bootstrapStatus: (
    bootstrapSecret: string
  ) => Promise<BootstrapStatusResult>;
  bootstrapExecute: (
    bootstrapSecret: string,
    payload: BootstrapAccount
  ) => Promise<IpcResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';