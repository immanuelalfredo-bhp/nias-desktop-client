export interface ElectronAPI {
  authStatus: () => Promise<{ isEmpty: boolean }>;
  bootstrapStatus: (bootstrapSecret: string) => Promise<{ isEmpty: boolean, isValid: boolean }>;
  bootstrapExecute: (bootstrapSecret: string, payload: any) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module "*.css";
declare module "*.css?inline";