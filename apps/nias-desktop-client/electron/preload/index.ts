import { contextBridge, ipcRenderer } from 'electron';
import { attribute, auth, system } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication IPC handlers
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: auth.LoginCredentials) => ipcRenderer.invoke('auth:login', payload),
  authSync: () => ipcRenderer.invoke('auth:sync'),

  // Bootstrap IPC handlers
  bootstrapStatus: (bootstrapSecret: string) =>
    ipcRenderer.invoke('bootstrap:status', bootstrapSecret),
  bootstrapExecute: (bootstrapSecret: string, payload: auth.BootstrapInput) =>
    ipcRenderer.invoke('bootstrap:execute', bootstrapSecret, payload),

  // Sync IPC handlers
  syncPull: () => ipcRenderer.invoke('sync:pull'),

  // User IPC handlers
  userListActive: () => ipcRenderer.invoke('user:list-active'),
  userListDeleted: () => ipcRenderer.invoke('user:list-deleted'),
  userCreate: (payload: system.CreateUserInput) => ipcRenderer.invoke('user:create', payload),

  // Branding IPC handlers
  brandListActive: () => ipcRenderer.invoke('brand:list-active'),
  brandListDeleted: () => ipcRenderer.invoke('brand:list-deleted'),
  brandCreate: (payload: attribute.CreateBrandInput) => ipcRenderer.invoke('brand:create', payload),
  brandUpdate: (payload: attribute.UpdateBrandInput) => ipcRenderer.invoke('brand:update', payload),
  brandDelete: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:delete', payload),
  brandRestore: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:restore', payload),

  // Mode IPC handlers
  modeListActive: () => ipcRenderer.invoke('mode:list-active'),
  modeListDeleted: () => ipcRenderer.invoke('mode:list-deleted'),
  modeCreate: (payload: attribute.CreateModeInput) => ipcRenderer.invoke('mode:create', payload),
  modeUpdate: (payload: attribute.UpdateModeInput) => ipcRenderer.invoke('mode:update', payload),
  modeDelete: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:delete', payload),
  modeRestore: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:restore', payload),

  // UoM IPC handlers
  uomListActive: () => ipcRenderer.invoke('uom:list-active'),
  uomListDeleted: () => ipcRenderer.invoke('uom:list-deleted'),
  uomCreate: (payload: attribute.CreateUomInput) => ipcRenderer.invoke('uom:create', payload),
  uomUpdate: (payload: attribute.UpdateUomInput) => ipcRenderer.invoke('uom:update', payload),
  uomDelete: (payload: attribute.UomId) => ipcRenderer.invoke('uom:delete', payload),
  uomRestore: (payload: attribute.UomId) => ipcRenderer.invoke('uom:restore', payload),

  // Dimension IPC handlers
  dimensionListActive: () => ipcRenderer.invoke('dimension:list-active'),
  dimensionListDeleted: () => ipcRenderer.invoke('dimension:list-deleted'),
  dimensionCreate: (payload: attribute.CreateDimensionInput) =>
    ipcRenderer.invoke('dimension:create', payload),
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) =>
    ipcRenderer.invoke('dimension:update', payload),
  dimensionDelete: (payload: attribute.DimensionId) =>
    ipcRenderer.invoke('dimension:delete', payload),
  dimensionRestore: (payload: attribute.DimensionId) =>
    ipcRenderer.invoke('dimension:restore', payload),

  // Dimension Value IPC handlers
  dimensionValueListActive: () => ipcRenderer.invoke('dimensionValue:list-active'),
  dimensionValueListDeleted: () => ipcRenderer.invoke('dimensionValue:list-deleted'),
  dimensionValueCreate: (payload: attribute.CreateDimensionValue) =>
    ipcRenderer.invoke('dimensionValue:create', payload),
  dimensionValueUpdate: (payload: attribute.UpdateDimensionValue) =>
    ipcRenderer.invoke('dimensionValue:update', payload),
  dimensionValueDelete: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimensionValue:delete', payload),
  dimensionValueRestore: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimensionValue:restore', payload),

  // System IPC handlers
  systemListActive: () => ipcRenderer.invoke('system:list-active'),
  systemListDeleted: () => ipcRenderer.invoke('system:list-deleted'),
  systemCreate: (payload: attribute.CreateSystemInput) => ipcRenderer.invoke('system:create', payload),
  systemUpdate: (payload: attribute.UpdateSystemInput) => ipcRenderer.invoke('system:update', payload),
  systemDelete: (payload: attribute.SystemId) => ipcRenderer.invoke('system:delete', payload),
  systemRestore: (payload: attribute.SystemId) => ipcRenderer.invoke('system:restore', payload),

  // Category IPC handlers
  categoryListActive: () => ipcRenderer.invoke('category:list-active'),
  categoryListDeleted: () => ipcRenderer.invoke('category:list-deleted'),
  categoryCreate: (payload: attribute.CreateCategoryInput) =>
    ipcRenderer.invoke('category:create', payload),
  categoryUpdate: (payload: attribute.UpdateCategoryInput) =>
    ipcRenderer.invoke('category:update', payload),
  categoryDelete: (payload: attribute.CategoryId) => ipcRenderer.invoke('category:delete', payload),
  categoryRestore: (payload: attribute.CategoryId) => ipcRenderer.invoke('category:restore', payload),

  // Vendor IPC handlers
  vendorListActive: () => ipcRenderer.invoke('vendor:list-active'),
  vendorListDeleted: () => ipcRenderer.invoke('vendor:list-deleted'),
  vendorCreate: (payload: attribute.CreateVendorInput) => ipcRenderer.invoke('vendor:create', payload),
  vendorUpdate: (payload: attribute.UpdateVendorInput) => ipcRenderer.invoke('vendor:update', payload),
  vendorDelete: (payload: attribute.VendorId) => ipcRenderer.invoke('vendor:delete', payload),
  vendorRestore: (payload: attribute.VendorId) => ipcRenderer.invoke('vendor:restore', payload),

  // Tag IPC handlers
  tagListActive: () => ipcRenderer.invoke('tag:list-active'),
  tagListDeleted: () => ipcRenderer.invoke('tag:list-deleted'),
  tagCreate: (payload: attribute.CreateTagInput) => ipcRenderer.invoke('tag:create', payload),
  tagUpdate: (payload: attribute.UpdateTagInput) => ipcRenderer.invoke('tag:update', payload),
  tagDelete: (payload: attribute.TagId) => ipcRenderer.invoke('tag:delete', payload),
  tagRestore: (payload: attribute.TagId) => ipcRenderer.invoke('tag:restore', payload),
});
