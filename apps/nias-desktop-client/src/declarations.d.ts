export interface ElectronAPI {
  authStatus: () => Promise<{ isEmpty: boolean }>;
  authLogin: (payload: { username: string, password: string }) => Promise<{ success: boolean, message?: string }>;
  authFetchUser: (username: string, password: string) => Promise<{ success: boolean, message?: string }>;
  authSyncUsers: () => Promise<{ success: boolean, message?: string }>;
  bootstrapStatus: (bootstrapSecret: string) => Promise<{ success: boolean, isEmpty: boolean, isValid: boolean }>;
  bootstrapExecute: (bootstrapSecret: string, payload: any) => Promise<{ success: boolean, message?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module "*.css";
declare module "*.css?inline";