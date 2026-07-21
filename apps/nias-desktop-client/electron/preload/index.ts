import { contextBridge, ipcRenderer } from 'electron';
import { attribute, item, variant, order, system } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {
  // User IPC handlers
  userListActive: () => ipcRenderer.invoke('user:list-active'),
  userListDeleted: () => ipcRenderer.invoke('user:list-deleted'),
  userCreate: (payload: system.CreateUserInput) => ipcRenderer.invoke('user:create', payload),
  userUpdate: (payload: system.UpdateUser) => ipcRenderer.invoke('user:update', payload),
  userUpdateSelf: (payload: system.UpdateSelfInput) =>
    ipcRenderer.invoke('user:update-self', payload),
  userUpdatePassword: (payload: system.UpdateUserPasswordInput) =>
    ipcRenderer.invoke('user:update-password', payload),
  userDelete: (payload: system.UserId) => ipcRenderer.invoke('user:delete', payload),
  userRestore: (payload: system.UserId) => ipcRenderer.invoke('user:restore', payload),
  userUpsert: (payload: system.CreateUserPayload[]) => ipcRenderer.invoke('user:upsert', payload),

  // Role IPC handlers
  roleListActive: () => ipcRenderer.invoke('role:list-active'),
  roleListDeleted: () => ipcRenderer.invoke('role:list-deleted'),
  roleCreate: (payload: system.CreateRoleInput) => ipcRenderer.invoke('role:create', payload),
  roleUpdate: (payload: system.UpdateRoleInput) => ipcRenderer.invoke('role:update', payload),
  roleDelete: (payload: system.RoleId) => ipcRenderer.invoke('role:delete', payload),
  roleRestore: (payload: system.RoleId) => ipcRenderer.invoke('role:restore', payload),
  roleUpsert: (payload: system.Role[]) => ipcRenderer.invoke('role:upsert', payload),

  // Project IPC handlers
  projectListActive: () => ipcRenderer.invoke('project:list-active'),
  projectListDeleted: () => ipcRenderer.invoke('project:list-deleted'),
  projectCreate: (payload: system.CreateProjectInput) =>
    ipcRenderer.invoke('project:create', payload),
  projectUpdate: (payload: system.UpdateProjectInput) =>
    ipcRenderer.invoke('project:update', payload),
  projectDelete: (payload: system.ProjectId) => ipcRenderer.invoke('project:delete', payload),
  projectRestore: (payload: system.ProjectId) => ipcRenderer.invoke('project:restore', payload),
  projectUpsert: (payload: system.Project[]) => ipcRenderer.invoke('project:upsert', payload),

  // Role Capability IPC handlers
  roleCapabilityListActive: () => ipcRenderer.invoke('role-capability:list-active'),
  roleCapabilityListDeleted: () => ipcRenderer.invoke('role-capability:list-deleted'),
  roleCapabilityCreate: (payload: system.CreateRoleCapabilityInput) =>
    ipcRenderer.invoke('role-capability:create', payload),
  roleCapabilityUpdate: (payload: system.UpdateRoleCapability) =>
    ipcRenderer.invoke('role-capability:update', payload),
  roleCapabilityDelete: (payload: system.RoleCapabilityId) =>
    ipcRenderer.invoke('role-capability:delete', payload),
  roleCapabilityRestore: (payload: system.RoleCapabilityId) =>
    ipcRenderer.invoke('role-capability:restore', payload),
  roleCapabilityUpsert: (payload: system.RoleCapability[]) =>
    ipcRenderer.invoke('role-capability:upsert', payload),

  // Role Management IPC handlers
  roleManagementListActive: () => ipcRenderer.invoke('role-capability:list-active'),
  roleManagementListDeleted: () => ipcRenderer.invoke('role-capability:list-deleted'),
  roleManagementCreate: (payload: system.CreateRoleManagementInput) =>
    ipcRenderer.invoke('role-capability:create', payload),
  roleManagementUpdate: (payload: system.UpdateRoleManagement) =>
    ipcRenderer.invoke('role-capability:update', payload),
  roleManagementDelete: (payload: system.RoleManagementId) =>
    ipcRenderer.invoke('role-capability:delete', payload),
  roleManagementRestore: (payload: system.RoleManagementId) =>
    ipcRenderer.invoke('role-capability:restore', payload),
  roleManagementUpsert: (payload: system.RoleManagement[]) =>
    ipcRenderer.invoke('role-capability:upsert', payload),

  // Role Map IPC handlers
  roleMapListActive: () => ipcRenderer.invoke('role-map:list-active'),
  roleMapListDeleted: () => ipcRenderer.invoke('role-map:list-deleted'),
  roleMapCreate: (payload: system.CreateRoleMapInput) =>
    ipcRenderer.invoke('role-map:create', payload),
  roleMapUpdate: (payload: system.UpdateRoleMap) => ipcRenderer.invoke('role-map:update', payload),
  roleMapDelete: (payload: system.RoleMapId) => ipcRenderer.invoke('role-map:delete', payload),
  roleMapRestore: (payload: system.RoleMapId) => ipcRenderer.invoke('role-map:restore', payload),
  roleMapUpsert: (payload: system.RoleMap[]) => ipcRenderer.invoke('role-map:upsert', payload),

  // Project Map IPC handlers
  projectMapListActive: () => ipcRenderer.invoke('project-map:list-active'),
  projectMapListDeleted: () => ipcRenderer.invoke('project-map:list-deleted'),
  projectMapCreate: (payload: system.CreateProjectMapInput) =>
    ipcRenderer.invoke('project-map:create', payload),
  projectMapUpdate: (payload: system.UpdateProjectMap) =>
    ipcRenderer.invoke('project-map:update', payload),
  projectMapDelete: (payload: system.ProjectMapId) =>
    ipcRenderer.invoke('project-map:delete', payload),
  projectMapRestore: (payload: system.ProjectMapId) =>
    ipcRenderer.invoke('project-map:restore', payload),
  projectMapUpsert: (payload: system.ProjectMap[]) =>
    ipcRenderer.invoke('project-map:upsert', payload),

  // Audit IPC handlers
  auditList: () => ipcRenderer.invoke('audit:list'),

  // Brand IPC handlers
  brandListActive: () => ipcRenderer.invoke('brand:list-active'),
  brandListDeleted: () => ipcRenderer.invoke('brand:list-deleted'),
  brandCreate: (payload: attribute.CreateBrandInput) => ipcRenderer.invoke('brand:create', payload),
  brandUpdate: (payload: attribute.UpdateBrandInput) => ipcRenderer.invoke('brand:update', payload),
  brandDelete: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:delete', payload),
  brandRestore: (payload: attribute.BrandId) => ipcRenderer.invoke('brand:restore', payload),
  brandUpsert: (payload: attribute.Brand[]) => ipcRenderer.invoke('brand:upsert', payload),

  // Mode IPC handlers
  modeListActive: () => ipcRenderer.invoke('mode:list-active'),
  modeListDeleted: () => ipcRenderer.invoke('mode:list-deleted'),
  modeCreate: (payload: attribute.CreateModeInput) => ipcRenderer.invoke('mode:create', payload),
  modeUpdate: (payload: attribute.UpdateModeInput) => ipcRenderer.invoke('mode:update', payload),
  modeDelete: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:delete', payload),
  modeRestore: (payload: attribute.ModeId) => ipcRenderer.invoke('mode:restore', payload),
  modeUpsert: (payload: attribute.Mode[]) => ipcRenderer.invoke('mode:upsert', payload),

  // UoM IPC handlers
  uomListActive: () => ipcRenderer.invoke('uom:list-active'),
  uomListDeleted: () => ipcRenderer.invoke('uom:list-deleted'),
  uomCreate: (payload: attribute.CreateUomInput) => ipcRenderer.invoke('uom:create', payload),
  uomUpdate: (payload: attribute.UpdateUomInput) => ipcRenderer.invoke('uom:update', payload),
  uomDelete: (payload: attribute.UomId) => ipcRenderer.invoke('uom:delete', payload),
  uomRestore: (payload: attribute.UomId) => ipcRenderer.invoke('uom:restore', payload),
  uomUpsert: (payload: attribute.Uom[]) => ipcRenderer.invoke('uom:upsert', payload),

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
  dimensionUpsert: (payload: attribute.Dimension[]) =>
    ipcRenderer.invoke('dimension:upsert', payload),

  // Dimension Value IPC handlers
  dimensionValueListActive: () => ipcRenderer.invoke('dimension-value:list-active'),
  dimensionValueListDeleted: () => ipcRenderer.invoke('dimension-value:list-deleted'),
  dimensionValueCreate: (payload: attribute.CreateDimensionValueInput) =>
    ipcRenderer.invoke('dimension-value:create', payload),
  dimensionValueUpdate: (payload: attribute.UpdateDimensionValue) =>
    ipcRenderer.invoke('dimension-value:update', payload),
  dimensionValueDelete: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimension-value:delete', payload),
  dimensionValueRestore: (payload: attribute.DimensionValueId) =>
    ipcRenderer.invoke('dimension-value:restore', payload),
  dimensionValueUpsert: (payload: attribute.DimensionValue[]) =>
    ipcRenderer.invoke('dimension-value:upsert', payload),

  // System IPC handlers
  systemListActive: () => ipcRenderer.invoke('system:list-active'),
  systemListDeleted: () => ipcRenderer.invoke('system:list-deleted'),
  systemCreate: (payload: attribute.CreateSystemInput) =>
    ipcRenderer.invoke('system:create', payload),
  systemUpdate: (payload: attribute.UpdateSystemInput) =>
    ipcRenderer.invoke('system:update', payload),
  systemDelete: (payload: attribute.SystemId) => ipcRenderer.invoke('system:delete', payload),
  systemRestore: (payload: attribute.SystemId) => ipcRenderer.invoke('system:restore', payload),
  systemUpsert: (payload: attribute.System[]) => ipcRenderer.invoke('system:upsert', payload),

  // Category IPC handlers
  categoryListActive: () => ipcRenderer.invoke('category:list-active'),
  categoryListDeleted: () => ipcRenderer.invoke('category:list-deleted'),
  categoryCreate: (payload: attribute.CreateCategoryInput) =>
    ipcRenderer.invoke('category:create', payload),
  categoryUpdate: (payload: attribute.UpdateCategoryInput) =>
    ipcRenderer.invoke('category:update', payload),
  categoryDelete: (payload: attribute.CategoryId) => ipcRenderer.invoke('category:delete', payload),
  categoryRestore: (payload: attribute.CategoryId) =>
    ipcRenderer.invoke('category:restore', payload),
  categoryUpsert: (payload: attribute.Category[]) => ipcRenderer.invoke('category:upsert', payload),

  // Vendor IPC handlers
  vendorListActive: () => ipcRenderer.invoke('vendor:list-active'),
  vendorListDeleted: () => ipcRenderer.invoke('vendor:list-deleted'),
  vendorCreate: (payload: attribute.CreateVendorInput) =>
    ipcRenderer.invoke('vendor:create', payload),
  vendorUpdate: (payload: attribute.UpdateVendorInput) =>
    ipcRenderer.invoke('vendor:update', payload),
  vendorDelete: (payload: attribute.VendorId) => ipcRenderer.invoke('vendor:delete', payload),
  vendorRestore: (payload: attribute.VendorId) => ipcRenderer.invoke('vendor:restore', payload),
  vendorUpsert: (payload: attribute.Vendor[]) => ipcRenderer.invoke('vendor:upsert', payload),

  // Tag IPC handlers
  tagListActive: () => ipcRenderer.invoke('tag:list-active'),
  tagListDeleted: () => ipcRenderer.invoke('tag:list-deleted'),
  tagCreate: (payload: attribute.CreateTagInput) => ipcRenderer.invoke('tag:create', payload),
  tagUpdate: (payload: attribute.UpdateTagInput) => ipcRenderer.invoke('tag:update', payload),
  tagDelete: (payload: attribute.TagId) => ipcRenderer.invoke('tag:delete', payload),
  tagRestore: (payload: attribute.TagId) => ipcRenderer.invoke('tag:restore', payload),
  tagUpsert: (payload: attribute.Tag[]) => ipcRenderer.invoke('tag:upsert', payload),

  // Item Record IPC handlers
  itemRecordListActive: () => ipcRenderer.invoke('item-record:list-active'),
  itemRecordListDeleted: () => ipcRenderer.invoke('item-record:list-deleted'),
  itemRecordCreate: (payload: item.CreateItemRecordInput) =>
    ipcRenderer.invoke('item-record:create', payload),
  itemRecordUpdate: (payload: item.UpdateItemRecordInput) =>
    ipcRenderer.invoke('item-record:update', payload),
  itemRecordDelete: (payload: item.ItemRecordId) =>
    ipcRenderer.invoke('item-record:delete', payload),
  itemRecordRestore: (payload: item.ItemRecordId) =>
    ipcRenderer.invoke('item-record:restore', payload),
  itemRecordUpsert: (payload: item.ItemRecord[]) =>
    ipcRenderer.invoke('item-record:upsert', payload),

  // Alias IPC handlers
  aliasListActive: () => ipcRenderer.invoke('alias:list-active'),
  aliasListDeleted: () => ipcRenderer.invoke('alias:list-deleted'),
  aliasCreate: (payload: item.CreateAliasInput) => ipcRenderer.invoke('alias:create', payload),
  aliasUpdate: (payload: item.UpdateAliasInput) => ipcRenderer.invoke('alias:update', payload),
  aliasDelete: (payload: item.AliasId) => ipcRenderer.invoke('alias:delete', payload),
  aliasRestore: (payload: item.AliasId) => ipcRenderer.invoke('alias:restore', payload),
  aliasUpsert: (payload: item.Alias[]) => ipcRenderer.invoke('alias:upsert', payload),

  // Brandline Map IPC handlers
  brandlineMapListActive: () => ipcRenderer.invoke('brandline-map:list-active'),
  brandlineMapListDeleted: () => ipcRenderer.invoke('brandline-map:list-deleted'),
  brandlineMapCreate: (payload: item.CreateBrandlineMapInput) =>
    ipcRenderer.invoke('brandline-map:create', payload),
  brandlineMapUpdate: (payload: item.UpdateBrandlineMap) =>
    ipcRenderer.invoke('brandline-map:update', payload),
  brandlineMapDelete: (payload: item.BrandlineMapId) =>
    ipcRenderer.invoke('brandline-map:delete', payload),
  brandlineMapRestore: (payload: item.BrandlineMapId) =>
    ipcRenderer.invoke('brandline-map:restore', payload),
  brandlineMapUpsert: (payload: item.BrandlineMap[]) =>
    ipcRenderer.invoke('brandline-map:upsert', payload),

  // Vendor Map IPC handlers
  vendorMapListActive: () => ipcRenderer.invoke('vendor-map:list-active'),
  vendorMapListDeleted: () => ipcRenderer.invoke('vendor-map:list-deleted'),
  vendorMapCreate: (payload: item.CreateVendorMapInput) =>
    ipcRenderer.invoke('vendor-map:create', payload),
  vendorMapUpdate: (payload: item.UpdateVendorMap) =>
    ipcRenderer.invoke('vendor-map:update', payload),
  vendorMapDelete: (payload: item.VendorMapId) => ipcRenderer.invoke('vendor-map:delete', payload),
  vendorMapRestore: (payload: item.VendorMapId) =>
    ipcRenderer.invoke('vendor-map:restore', payload),
  vendorMapUpsert: (payload: item.VendorMap[]) => ipcRenderer.invoke('vendor-map:upsert', payload),

  // Dimension Map IPC handlers
  dimensionMapListActive: () => ipcRenderer.invoke('dimension-map:list-active'),
  dimensionMapListDeleted: () => ipcRenderer.invoke('dimension-map:list-deleted'),
  dimensionMapCreate: (payload: item.CreateDimensionMapInput) =>
    ipcRenderer.invoke('dimension-map:create', payload),
  dimensionMapUpdate: (payload: item.UpdateDimensionMap) =>
    ipcRenderer.invoke('dimension-map:update', payload),
  dimensionMapDelete: (payload: item.DimensionMapId) =>
    ipcRenderer.invoke('dimension-map:delete', payload),
  dimensionMapRestore: (payload: item.DimensionMapId) =>
    ipcRenderer.invoke('dimension-map:restore', payload),
  dimensionMapUpsert: (payload: item.DimensionMap[]) =>
    ipcRenderer.invoke('dimension-map:upsert', payload),

  // System Map IPC handlers
  systemMapListActive: () => ipcRenderer.invoke('system-map:list-active'),
  systemMapListDeleted: () => ipcRenderer.invoke('system-map:list-deleted'),
  systemMapCreate: (payload: item.CreateSystemMapInput) =>
    ipcRenderer.invoke('system-map:create', payload),
  systemMapUpdate: (payload: item.UpdateSystemMap) =>
    ipcRenderer.invoke('system-map:update', payload),
  systemMapDelete: (payload: item.SystemMapId) => ipcRenderer.invoke('system-map:delete', payload),
  systemMapRestore: (payload: item.SystemMapId) =>
    ipcRenderer.invoke('system-map:restore', payload),
  systemMapUpsert: (payload: item.SystemMap[]) => ipcRenderer.invoke('system-map:upsert', payload),

  // Tag Map IPC handlers
  tagMapListActive: () => ipcRenderer.invoke('tag-map:list-active'),
  tagMapListDeleted: () => ipcRenderer.invoke('tag-map:list-deleted'),
  tagMapCreate: (payload: item.CreateTagMapInput) => ipcRenderer.invoke('tag-map:create', payload),
  tagMapUpdate: (payload: item.UpdateTagMap) => ipcRenderer.invoke('tag-map:update', payload),
  tagMapDelete: (payload: item.TagMapId) => ipcRenderer.invoke('tag-map:delete', payload),
  tagMapRestore: (payload: item.TagMapId) => ipcRenderer.invoke('tag-map:restore', payload),
  tagMapUpsert: (payload: item.TagMap[]) => ipcRenderer.invoke('tag-map:upsert', payload),

  // Generation Rules IPC handlers
  generationRuleListActive: () => ipcRenderer.invoke('generation-rule:list-active'),
  generationRuleListDeleted: () => ipcRenderer.invoke('generation-rule:list-deleted'),
  generationRuleCreate: (payload: item.CreateGenerationRuleInput) =>
    ipcRenderer.invoke('generation-rule:create', payload),
  generationRuleUpdate: (payload: item.UpdateGenerationRule) =>
    ipcRenderer.invoke('generation-rule:update', payload),
  generationRuleDelete: (payload: item.GenerationRulesId) =>
    ipcRenderer.invoke('generation-rule:delete', payload),
  generationRuleRestore: (payload: item.GenerationRulesId) =>
    ipcRenderer.invoke('generation-rule:restore', payload),
  generationRuleUpsert: (payload: item.GenerationRules[]) =>
    ipcRenderer.invoke('generation-rule:upsert', payload),

  // Variant Record IPC handlers
  variantRecordListActive: () => ipcRenderer.invoke('variant-record:list-active'),
  variantRecordListDeleted: () => ipcRenderer.invoke('variant-record:list-deleted'),
  variantRecordCreate: (payload: variant.CreateVariantRecordInput) =>
    ipcRenderer.invoke('variant-record:create', payload),
  variantRecordUpdate: (payload: variant.UpdateVariantRecord) =>
    ipcRenderer.invoke('variant-record:update', payload),
  variantRecordDelete: (payload: variant.VariantRecordId) =>
    ipcRenderer.invoke('variant-record:delete', payload),
  variantRecordRestore: (payload: variant.VariantRecordId) =>
    ipcRenderer.invoke('variant-record:restore', payload),
  variantRecordUpsert: (payload: variant.VariantRecord[]) =>
    ipcRenderer.invoke('variant-record:upsert', payload),

  // Component Map IPC handlers
  componentMapListActive: () => ipcRenderer.invoke('component-map:list-active'),
  componentMapListDeleted: () => ipcRenderer.invoke('component-map:list-deleted'),
  componentMapCreate: (payload: variant.CreateComponentMapInput) =>
    ipcRenderer.invoke('component-map:create', payload),
  componentMapUpdate: (payload: variant.UpdateComponentMap) =>
    ipcRenderer.invoke('component-map:update', payload),
  componentMapDelete: (payload: variant.ComponentMapId) =>
    ipcRenderer.invoke('component-map:delete', payload),
  componentMapRestore: (payload: variant.ComponentMapId) =>
    ipcRenderer.invoke('component-map:restore', payload),
  componentMapUpsert: (payload: variant.ComponentMap[]) =>
    ipcRenderer.invoke('component-map:upsert', payload),

  // Dimension Value Map IPC handlers
  dimensionValueMapListActive: () => ipcRenderer.invoke('dimension-value-map:list-active'),
  dimensionValueMapListDeleted: () => ipcRenderer.invoke('dimension-value-map:list-deleted'),
  dimensionValueMapCreate: (payload: variant.CreateDimensionValueMapInput) =>
    ipcRenderer.invoke('dimension-value-map:create', payload),
  dimensionValueMapUpdate: (payload: variant.UpdateDimensionValueMap) =>
    ipcRenderer.invoke('dimension-value-map:update', payload),
  dimensionValueMapDelete: (payload: variant.DimensionValueMapId) =>
    ipcRenderer.invoke('dimension-value-map:delete', payload),
  dimensionValueMapRestore: (payload: variant.DimensionValueMapId) =>
    ipcRenderer.invoke('dimension-value-map:restore', payload),
  dimensionValueMapUpsert: (payload: variant.DimensionValueMap[]) =>
    ipcRenderer.invoke('dimension-value-map:upsert', payload),

  // Switch Map IPC handlers
  switchMapListActive: () => ipcRenderer.invoke('switch-map:list-active'),
  switchMapListDeleted: () => ipcRenderer.invoke('switch-map:list-deleted'),
  switchMapCreate: (payload: variant.CreateSwitchMapInput) =>
    ipcRenderer.invoke('switch-map:create', payload),
  switchMapUpdate: (payload: variant.UpdateSwitchMap) =>
    ipcRenderer.invoke('switch-map:update', payload),
  switchMapDelete: (payload: variant.SwitchMapId) =>
    ipcRenderer.invoke('switch-map:delete', payload),
  switchMapRestore: (payload: variant.SwitchMapId) =>
    ipcRenderer.invoke('switch-map:restore', payload),
  switchMapUpsert: (payload: variant.SwitchMap[]) =>
    ipcRenderer.invoke('switch-map:upsert', payload),

  // Vendor Price IPC handlers
  vendorPriceListActive: () => ipcRenderer.invoke('vendor-price:list-active'),
  vendorPriceListDeleted: () => ipcRenderer.invoke('vendor-price:list-deleted'),
  vendorPriceCreate: (payload: variant.CreateVendorPriceInput) =>
    ipcRenderer.invoke('vendor-price:create', payload),
  vendorPriceUpdate: (payload: variant.UpdateVendorPrice) =>
    ipcRenderer.invoke('vendor-price:update', payload),
  vendorPriceDelete: (payload: variant.VendorPriceId) =>
    ipcRenderer.invoke('vendor-price:delete', payload),
  vendorPriceRestore: (payload: variant.VendorPriceId) =>
    ipcRenderer.invoke('vendor-price:restore', payload),
  vendorPriceUpsert: (payload: variant.VendorPrice[]) =>
    ipcRenderer.invoke('vendor-price:upsert', payload),

  // Request IPC handlers
  requestListActive: () => ipcRenderer.invoke('request:list-active'),
  requestListDeleted: () => ipcRenderer.invoke('request:list-deleted'),
  requestCreate: (payload: order.CreateRequestInput) =>
    ipcRenderer.invoke('request:create', payload),
  requestUpdate: (payload: order.UpdateRequest) => ipcRenderer.invoke('request:update', payload),
  requestDelete: (payload: order.RequestId) => ipcRenderer.invoke('request:delete', payload),
  requestRestore: (payload: order.RequestId) => ipcRenderer.invoke('request:restore', payload),
  requestUpsert: (payload: order.Request[]) => ipcRenderer.invoke('request:upsert', payload),

  // Request Item IPC handlers
  requestItemListActive: () => ipcRenderer.invoke('request-item:list-active'),
  requestItemListDeleted: () => ipcRenderer.invoke('request-item:list-deleted'),
  requestItemCreate: (payload: order.CreateRequestItemInput) =>
    ipcRenderer.invoke('request-item:create', payload),
  requestItemUpdate: (payload: order.UpdateRequestItem) =>
    ipcRenderer.invoke('request-item:update', payload),
  requestItemDelete: (payload: order.RequestItemId) =>
    ipcRenderer.invoke('request-item:delete', payload),
  requestItemRestore: (payload: order.RequestItemId) =>
    ipcRenderer.invoke('request-item:restore', payload),
  requestItemUpsert: (payload: order.RequestItem[]) =>
    ipcRenderer.invoke('request-item:upsert', payload),

  // // Authentication IPC handlers
  // authStatus: () => ipcRenderer.invoke('auth:status'),
  // authLogin: (payload: auth.LoginCredentials) => ipcRenderer.invoke('auth:login', payload),
  // authSync: () => ipcRenderer.invoke('auth:sync'),

  // // Bootstrap IPC handlers
  // bootstrapStatus: (bootstrapSecret: string) =>
  //   ipcRenderer.invoke('bootstrap:status', bootstrapSecret),
  // bootstrapExecute: (bootstrapSecret: string, payload: auth.BootstrapInput) =>
  //   ipcRenderer.invoke('bootstrap:execute', bootstrapSecret, payload),

  // // Sync IPC handlers
  // syncPull: () => ipcRenderer.invoke('sync:pull'),
});
