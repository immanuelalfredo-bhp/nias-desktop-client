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

  // Brand IPC handlers
  brandListActive: () => Promise<Envelope<attribute.Brand[]>>;
  brandListDeleted: () => Promise<Envelope<attribute.Brand[]>>;
  brandCreate: (payload: attribute.CreateBrandInput) => Promise<common.SuccessResponse>;
  brandUpdate: (payload: attribute.UpdateBrandInput) => Promise<common.SuccessResponse>;
  brandDelete: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;
  brandRestore: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;

  // Mode IPC handlers
  modeListActive: () => Promise<Envelope<attribute.Mode[]>>;
  modeListDeleted: () => Promise<Envelope<attribute.Mode[]>>;
  modeCreate: (payload: attribute.CreateModeInput) => Promise<common.SuccessResponse>;
  modeUpdate: (payload: attribute.UpdateModeInput) => Promise<common.SuccessResponse>;
  modeDelete: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;
  modeRestore: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;

  // UoM IPC handlers
  uomListActive: () => Promise<Envelope<attribute.Uom[]>>;
  uomListDeleted: () => Promise<Envelope<attribute.Uom[]>>;
  uomCreate: (payload: attribute.CreateUomInput) => Promise<common.SuccessResponse>;
  uomUpdate: (payload: attribute.UpdateUomInput) => Promise<common.SuccessResponse>;
  uomDelete: (payload: attribute.UomId) => Promise<common.SuccessResponse>;
  uomRestore: (payload: attribute.UomId) => Promise<common.SuccessResponse>;

  // Dimension IPC handlers
  dimensionListActive: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionListDeleted: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionCreate: (payload: attribute.CreateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionDelete: (payload: attribute.DimensionId) => Promise<common.SuccessResponse>;
  dimensionRestore: (payload: attribute.DimensionId) => Promise<common.SuccessResponse>;

  // Dimension Value IPC handlers
  dimensionValueListActive: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueListDeleted: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueCreate: (payload: attribute.CreateDimensionValue) => Promise<common.SuccessResponse>;
  dimensionValueUpdate: (payload: attribute.UpdateDimensionValue) => Promise<common.SuccessResponse>;
  dimensionValueDelete: (payload: attribute.DimensionValueId) => Promise<common.SuccessResponse>;
  dimensionValueRestore: (payload: attribute.DimensionValueId) => Promise<common.SuccessResponse>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';
