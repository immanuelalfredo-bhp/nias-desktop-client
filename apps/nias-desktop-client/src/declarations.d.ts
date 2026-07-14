import { attribute, auth, common, sync, system } from '@nias/shared';
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
  userCreate: (payload: system.CreateUserInput) => Promise<common.SuccessResponse>;
  brandListActive: () => Promise<Envelope<attribute.Brand[]>>;
  brandListDeleted: () => Promise<Envelope<attribute.Brand[]>>;
  brandCreate: (payload: attribute.CreateBrandInput) => Promise<common.SuccessResponse>;
  brandUpdate: (payload: attribute.UpdateBrandInput) => Promise<common.SuccessResponse>;
  brandDelete: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;
  brandRestore: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;
  modeListActive: () => Promise<Envelope<attribute.Mode[]>>;
  modeListDeleted: () => Promise<Envelope<attribute.Mode[]>>;
  modeCreate: (payload: attribute.CreateModeInput) => Promise<common.SuccessResponse>;
  modeUpdate: (payload: attribute.UpdateModeInput) => Promise<common.SuccessResponse>;
  modeDelete: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;
  modeRestore: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';
