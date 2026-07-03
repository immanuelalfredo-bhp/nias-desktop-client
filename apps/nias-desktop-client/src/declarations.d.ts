import type { BootstrapAccount, LoginCredentials } from '@nias/shared';

interface AuthStatusResult {
  success: boolean;
  message?: string;
  isEmpty: boolean;
}

interface IpcResult {
  success: boolean;
  message?: string;
}

interface BootstrapStatusResult extends IpcResult {
  success: boolean;
  message?: string;
  isEmpty: boolean;
  isValid: boolean;
}

interface UserIdResult {
  success: boolean;
  message?: string;
  userId: string | null;
}

export interface ElectronAPI {
  authStatus: () => Promise<AuthStatusResult>;
  authLogin: (payload: LoginCredentials) => Promise<IpcResult>;
  authFetchUser: (username: string, password: string) => Promise<IpcResult>;
  authSyncUsers: () => Promise<IpcResult>;
  authGetLocalUserIdByUsername: (username: string) => Promise<UserIdResult>;
  authInitializeDb: (uuid: string | null) => Promise<IpcResult>;
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