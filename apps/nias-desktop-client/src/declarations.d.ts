import { system, attribute, item, variant, order, common } from '@nias/shared';
import type { Envelope } from '@nias/shared/server';

export interface ElectronAPI {
  // User IPC handlers
  userListActive: () => Promise<Envelope<system.User[]>>;
  userListDeleted: () => Promise<Envelope<system.User[]>>;
  userCreate: (payload: system.CreateUserInput) => Promise<common.SuccessResponse>;
  userUpdate: (payload: system.UpdateUserInput) => Promise<common.SuccessResponse>;
  userUpdateSelf: (payload: system.UpdateUserSelfInput) => Promise<common.SuccessResponse>;
  userUpdatePassword: (payload: system.UpdateUserPasswordInput) => Promise<common.SuccessResponse>;
  userDelete: (payload: system.UserId) => Promise<common.SuccessResponse>;
  userRestore: (payload: system.UserId) => Promise<common.SuccessResponse>;
  userUpsert: (payload: system.User[]) => Promise<common.SuccessResponse>;
  userUpdatePassword: (payload: system.UpdateUserPasswordInput) => Promise<common.SuccessResponse>;

  // Role IPC handlers
  roleListActive: () => Promise<Envelope<system.Role[]>>;
  roleListDeleted: () => Promise<Envelope<system.Role[]>>;
  roleCreate: (payload: system.CreateRoleInput) => Promise<common.SuccessResponse>;
  roleUpdate: (payload: system.UpdateRoleInput) => Promise<common.SuccessResponse>;
  roleDelete: (payload: system.RoleId) => Promise<common.SuccessResponse>;
  roleRestore: (payload: system.RoleId) => Promise<common.SuccessResponse>;
  roleUpsert: (payload: system.Role[]) => Promise<common.SuccessResponse>;

  // Project IPC handlers
  projectListActive: () => Promise<Envelope<system.Project[]>>;
  projectListDeleted: () => Promise<Envelope<system.Project[]>>;
  projectCreate: (payload: system.CreateProjectInput) => Promise<common.SuccessResponse>;
  projectUpdate: (payload: system.UpdateProjectInput) => Promise<common.SuccessResponse>;
  projectDelete: (payload: system.ProjectId) => Promise<common.SuccessResponse>;
  projectRestore: (payload: system.ProjectId) => Promise<common.SuccessResponse>;
  projectUpsert: (payload: system.Project[]) => Promise<common.SuccessResponse>;

  // Role Capability IPC handlers
  roleCapabilityListActive: () => Promise<Envelope<system.RoleCapability[]>>;
  roleCapabilityListDeleted: () => Promise<Envelope<system.RoleCapability[]>>;
  roleCapabilityCreate: (
    payload: system.CreateRoleCapabilityInput,
  ) => Promise<common.SuccessResponse>;
  roleCapabilityUpdate: (
    payload: system.UpdateRoleCapabilityInput,
  ) => Promise<common.SuccessResponse>;
  roleCapabilityDelete: (payload: system.RoleCapabilityId) => Promise<common.SuccessResponse>;
  roleCapabilityRestore: (payload: system.RoleCapabilityId) => Promise<common.SuccessResponse>;
  roleCapabilityUpsert: (payload: system.RoleCapability[]) => Promise<common.SuccessResponse>;

  // Role Management IPC handlers
  roleManagementListActive: () => Promise<Envelope<system.RoleManagement[]>>;
  roleManagementListDeleted: () => Promise<Envelope<system.RoleManagement[]>>;
  roleManagementCreate: (
    payload: system.CreateRoleManagementInput,
  ) => Promise<common.SuccessResponse>;
  roleManagementUpdate: (
    payload: system.UpdateRoleManagementInput,
  ) => Promise<common.SuccessResponse>;
  roleManagementDelete: (payload: system.RoleManagementId) => Promise<common.SuccessResponse>;
  roleManagementRestore: (payload: system.RoleManagementId) => Promise<common.SuccessResponse>;
  roleManagementUpsert: (payload: system.RoleManagement[]) => Promise<common.SuccessResponse>;

  // Role Map IPC handlers
  roleMapListActive: () => Promise<Envelope<system.RoleMap[]>>;
  roleMapListDeleted: () => Promise<Envelope<system.RoleMap[]>>;
  roleMapCreate: (payload: system.CreateRoleMapInput) => Promise<common.SuccessResponse>;
  roleMapUpdate: (payload: system.UpdateRoleMapInput) => Promise<common.SuccessResponse>;
  roleMapDelete: (payload: system.RoleMapId) => Promise<common.SuccessResponse>;
  roleMapRestore: (payload: system.RoleMapId) => Promise<common.SuccessResponse>;
  roleMapUpsert: (payload: system.RoleMap[]) => Promise<common.SuccessResponse>;

  // Project Map IPC handlers
  projectMapListActive: () => Promise<Envelope<system.ProjectMap[]>>;
  projectMapListDeleted: () => Promise<Envelope<system.ProjectMap[]>>;
  projectMapCreate: (payload: system.CreateProjectMapInput) => Promise<common.SuccessResponse>;
  projectMapUpdate: (payload: system.UpdateProjectMapInput) => Promise<common.SuccessResponse>;
  projectMapDelete: (payload: system.ProjectMapId) => Promise<common.SuccessResponse>;
  projectMapRestore: (payload: system.ProjectMapId) => Promise<common.SuccessResponse>;
  projectMapUpsert: (payload: system.ProjectMap[]) => Promise<common.SuccessResponse>;

  // Audit IPC handlers
  auditList: () => Promise<Envelope<system.Audit[]>>;

  // Brand IPC handlers
  brandListActive: () => Promise<Envelope<attribute.Brand[]>>;
  brandListDeleted: () => Promise<Envelope<attribute.Brand[]>>;
  brandCreate: (payload: attribute.CreateBrandInput) => Promise<common.SuccessResponse>;
  brandUpdate: (payload: attribute.UpdateBrandInput) => Promise<common.SuccessResponse>;
  brandDelete: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;
  brandRestore: (payload: attribute.BrandId) => Promise<common.SuccessResponse>;
  brandUpsert: (payload: attribute.Brand[]) => Promise<common.SuccessResponse>;

  // Mode IPC handlers
  modeListActive: () => Promise<Envelope<attribute.Mode[]>>;
  modeListDeleted: () => Promise<Envelope<attribute.Mode[]>>;
  modeCreate: (payload: attribute.CreateModeInput) => Promise<common.SuccessResponse>;
  modeUpdate: (payload: attribute.UpdateModeInput) => Promise<common.SuccessResponse>;
  modeDelete: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;
  modeRestore: (payload: attribute.ModeId) => Promise<common.SuccessResponse>;
  modeUpsert: (payload: attribute.Mode[]) => Promise<common.SuccessResponse>;

  // UoM IPC handlers
  uomListActive: () => Promise<Envelope<attribute.Uom[]>>;
  uomListDeleted: () => Promise<Envelope<attribute.Uom[]>>;
  uomCreate: (payload: attribute.CreateUomInput) => Promise<common.SuccessResponse>;
  uomUpdate: (payload: attribute.UpdateUomInput) => Promise<common.SuccessResponse>;
  uomDelete: (payload: attribute.UomId) => Promise<common.SuccessResponse>;
  uomRestore: (payload: attribute.UomId) => Promise<common.SuccessResponse>;
  uomUpsert: (payload: attribute.Uom[]) => Promise<common.SuccessResponse>;

  // Dimension IPC handlers
  dimensionListActive: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionListDeleted: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionCreate: (payload: attribute.CreateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionDelete: (payload: attribute.DimensionId) => Promise<common.SuccessResponse>;
  dimensionRestore: (payload: attribute.DimensionId) => Promise<common.SuccessResponse>;
  dimensionUpsert: (payload: attribute.Dimension[]) => Promise<common.SuccessResponse>;

  // Dimension Value IPC handlers
  dimensionValueListActive: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueListDeleted: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueCreate: (
    payload: attribute.CreateDimensionValueInput,
  ) => Promise<common.SuccessResponse>;
  dimensionValueUpdate: (
    payload: attribute.UpdateDimensionValue,
  ) => Promise<common.SuccessResponse>;
  dimensionValueDelete: (payload: attribute.DimensionValueId) => Promise<common.SuccessResponse>;
  dimensionValueRestore: (payload: attribute.DimensionValueId) => Promise<common.SuccessResponse>;
  dimensionValueUpsert: (payload: attribute.DimensionValue[]) => Promise<common.SuccessResponse>;

  // System IPC handlers
  systemListActive: () => Promise<Envelope<attribute.System[]>>;
  systemListDeleted: () => Promise<Envelope<attribute.System[]>>;
  systemCreate: (payload: attribute.CreateSystemInput) => Promise<common.SuccessResponse>;
  systemUpdate: (payload: attribute.UpdateSystemInput) => Promise<common.SuccessResponse>;
  systemDelete: (payload: attribute.SystemId) => Promise<common.SuccessResponse>;
  systemRestore: (payload: attribute.SystemId) => Promise<common.SuccessResponse>;
  systemUpsert: (payload: attribute.System[]) => Promise<common.SuccessResponse>;

  // Category IPC handlers
  categoryListActive: () => Promise<Envelope<attribute.Category[]>>;
  categoryListDeleted: () => Promise<Envelope<attribute.Category[]>>;
  categoryCreate: (payload: attribute.CreateCategoryInput) => Promise<common.SuccessResponse>;
  categoryUpdate: (payload: attribute.UpdateCategoryInput) => Promise<common.SuccessResponse>;
  categoryDelete: (payload: attribute.CategoryId) => Promise<common.SuccessResponse>;
  categoryRestore: (payload: attribute.CategoryId) => Promise<common.SuccessResponse>;
  categoryUpsert: (payload: attribute.Category[]) => Promise<common.SuccessResponse>;

  // Vendor IPC handlers
  vendorListActive: () => Promise<Envelope<attribute.Vendor[]>>;
  vendorListDeleted: () => Promise<Envelope<attribute.Vendor[]>>;
  vendorCreate: (payload: attribute.CreateVendorInput) => Promise<common.SuccessResponse>;
  vendorUpdate: (payload: attribute.UpdateVendorInput) => Promise<common.SuccessResponse>;
  vendorDelete: (payload: attribute.VendorId) => Promise<common.SuccessResponse>;
  vendorRestore: (payload: attribute.VendorId) => Promise<common.SuccessResponse>;
  vendorUpsert: (payload: attribute.Vendor[]) => Promise<common.SuccessResponse>;

  // Tag IPC handlers
  tagListActive: () => Promise<Envelope<attribute.Tag[]>>;
  tagListDeleted: () => Promise<Envelope<attribute.Tag[]>>;
  tagCreate: (payload: attribute.CreateTagInput) => Promise<common.SuccessResponse>;
  tagUpdate: (payload: attribute.UpdateTagInput) => Promise<common.SuccessResponse>;
  tagDelete: (payload: attribute.TagId) => Promise<common.SuccessResponse>;
  tagRestore: (payload: attribute.TagId) => Promise<common.SuccessResponse>;
  tagUpsert: (payload: attribute.Tag[]) => Promise<common.SuccessResponse>;

  // Item Record IPC handlers
  itemRecordListActive: () => Promise<Envelope<item.ItemRecord[]>>;
  itemRecordListDeleted: () => Promise<Envelope<item.ItemRecord[]>>;
  itemRecordCreate: (payload: item.CreateItemRecordInput) => Promise<common.SuccessResponse>;
  itemRecordUpdate: (payload: item.UpdateItemRecordInput) => Promise<common.SuccessResponse>;
  itemRecordDelete: (payload: item.ItemRecordId) => Promise<common.SuccessResponse>;
  itemRecordRestore: (payload: item.ItemRecordId) => Promise<common.SuccessResponse>;
  itemRecordUpsert: (payload: item.ItemRecord[]) => Promise<common.SuccessResponse>;

  // Alias IPC handlers
  aliasListActive: () => Promise<Envelope<item.Alias[]>>;
  aliasListDeleted: () => Promise<Envelope<item.Alias[]>>;
  aliasCreate: (payload: item.CreateAliasInput) => Promise<common.SuccessResponse>;
  aliasUpdate: (payload: item.UpdateAliasInput) => Promise<common.SuccessResponse>;
  aliasDelete: (payload: item.AliasId) => Promise<common.SuccessResponse>;
  aliasRestore: (payload: item.AliasId) => Promise<common.SuccessResponse>;
  aliasUpsert: (payload: item.Alias[]) => Promise<common.SuccessResponse>;

  // Brandline Map IPC handlers
  brandlineMapListActive: () => Promise<Envelope<item.BrandlineMap[]>>;
  brandlineMapListDeleted: () => Promise<Envelope<item.BrandlineMap[]>>;
  brandlineMapCreate: (payload: item.CreateBrandlineMapInput) => Promise<common.SuccessResponse>;
  brandlineMapUpdate: (payload: item.UpdateBrandlineMapInput) => Promise<common.SuccessResponse>;
  brandlineMapDelete: (payload: item.BrandlineMapId) => Promise<common.SuccessResponse>;
  brandlineMapRestore: (payload: item.BrandlineMapId) => Promise<common.SuccessResponse>;
  brandlineMapUpsert: (payload: item.BrandlineMap[]) => Promise<common.SuccessResponse>;

  // Vendor Map IPC handlers
  vendorMapListActive: () => Promise<Envelope<item.VendorMap[]>>;
  vendorMapListDeleted: () => Promise<Envelope<item.VendorMap[]>>;
  vendorMapCreate: (payload: item.CreateVendorMapInput) => Promise<common.SuccessResponse>;
  vendorMapUpdate: (payload: item.UpdateVendorMapInput) => Promise<common.SuccessResponse>;
  vendorMapDelete: (payload: item.VendorMapId) => Promise<common.SuccessResponse>;
  vendorMapRestore: (payload: item.VendorMapId) => Promise<common.SuccessResponse>;
  vendorMapUpsert: (payload: item.VendorMap[]) => Promise<common.SuccessResponse>;

  // Dimension Map IPC handlers
  dimensionMapListActive: () => Promise<Envelope<item.DimensionMap[]>>;
  dimensionMapListDeleted: () => Promise<Envelope<item.DimensionMap[]>>;
  dimensionMapCreate: (payload: item.CreateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapUpdate: (payload: item.UpdateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapDelete: (payload: item.DimensionMapId) => Promise<common.SuccessResponse>;
  dimensionMapRestore: (payload: item.DimensionMapId) => Promise<common.SuccessResponse>;
  dimensionMapUpsert: (payload: item.DimensionMap[]) => Promise<common.SuccessResponse>;

  // System Map IPC handlers
  systemMapListActive: () => Promise<Envelope<item.SystemMap[]>>;
  systemMapListDeleted: () => Promise<Envelope<item.SystemMap[]>>;
  systemMapCreate: (payload: item.CreateSystemMapInput) => Promise<common.SuccessResponse>;
  systemMapUpdate: (payload: item.UpdateSystemMapInput) => Promise<common.SuccessResponse>;
  systemMapDelete: (payload: item.SystemMapId) => Promise<common.SuccessResponse>;
  systemMapRestore: (payload: item.SystemMapId) => Promise<common.SuccessResponse>;
  systemMapUpsert: (payload: item.SystemMap[]) => Promise<common.SuccessResponse>;

  // Tag Map IPC handlers
  tagMapListActive: () => Promise<Envelope<item.TagMap[]>>;
  tagMapListDeleted: () => Promise<Envelope<item.TagMap[]>>;
  tagMapCreate: (payload: item.CreateTagMapInput) => Promise<common.SuccessResponse>;
  tagMapUpdate: (payload: item.UpdateTagMapInput) => Promise<common.SuccessResponse>;
  tagMapDelete: (payload: item.TagMapId) => Promise<common.SuccessResponse>;
  tagMapRestore: (payload: item.TagMapId) => Promise<common.SuccessResponse>;
  tagMapUpsert: (payload: item.TagMap[]) => Promise<common.SuccessResponse>;

  // Generation Rule IPC handlers
  generationRuleListActive: () => Promise<Envelope<item.GenerationRules[]>>;
  generationRuleListDeleted: () => Promise<Envelope<item.GenerationRules[]>>;
  generationRuleCreate: (
    payload: item.CreateGenerationRuleInput,
  ) => Promise<common.SuccessResponse>;
  generationRuleUpdate: (
    payload: item.UpdateGenerationRuleInput,
  ) => Promise<common.SuccessResponse>;
  generationRuleDelete: (payload: item.GenerationRulesId) => Promise<common.SuccessResponse>;
  generationRuleRestore: (payload: item.GenerationRulesId) => Promise<common.SuccessResponse>;
  generationRuleUpsert: (payload: item.GenerationRules[]) => Promise<common.SuccessResponse>;

  // Variant IPC handlers
  variantListActive: () => Promise<Envelope<variant.VariantRecord[]>>;
  variantListDeleted: () => Promise<Envelope<variant.VariantRecord[]>>;
  variantCreate: (payload: variant.CreateVariantRecordInput) => Promise<common.SuccessResponse>;
  variantUpdate: (payload: variant.UpdateVariantRecordInput) => Promise<common.SuccessResponse>;
  variantDelete: (payload: variant.VariantRecordId) => Promise<common.SuccessResponse>;
  variantRestore: (payload: variant.VariantRecordId) => Promise<common.SuccessResponse>;
  variantUpsert: (payload: variant.VariantRecord[]) => Promise<common.SuccessResponse>;

  // Component IPC handlers
  componentListActive: () => Promise<Envelope<variant.ComponentRecord[]>>;
  componentListDeleted: () => Promise<Envelope<variant.ComponentRecord[]>>;
  componentCreate: (payload: variant.CreateComponentRecordInput) => Promise<common.SuccessResponse>;
  componentUpdate: (payload: variant.UpdateComponentRecordInput) => Promise<common.SuccessResponse>;
  componentDelete: (payload: variant.ComponentRecordId) => Promise<common.SuccessResponse>;
  componentRestore: (payload: variant.ComponentRecordId) => Promise<common.SuccessResponse>;
  componentUpsert: (payload: variant.ComponentRecord[]) => Promise<common.SuccessResponse>;

  // Dimension Map IPC handlers
  dimensionMapListActive: () => Promise<Envelope<variant.DimensionMap[]>>;
  dimensionMapListDeleted: () => Promise<Envelope<variant.DimensionMap[]>>;
  dimensionMapCreate: (payload: variant.CreateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapUpdate: (payload: variant.UpdateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapDelete: (payload: variant.DimensionMapId) => Promise<common.SuccessResponse>;
  dimensionMapRestore: (payload: variant.DimensionMapId) => Promise<common.SuccessResponse>;
  dimensionMapUpsert: (payload: variant.DimensionMap[]) => Promise<common.SuccessResponse>;

  // Switch IPC handlers
  switchListActive: () => Promise<Envelope<variant.SwitchRecord[]>>;
  switchListDeleted: () => Promise<Envelope<variant.SwitchRecord[]>>;
  switchCreate: (payload: variant.CreateSwitchRecordInput) => Promise<common.SuccessResponse>;
  switchUpdate: (payload: variant.UpdateSwitchRecordInput) => Promise<common.SuccessResponse>;
  switchDelete: (payload: variant.SwitchRecordId) => Promise<common.SuccessResponse>;
  switchRestore: (payload: variant.SwitchRecordId) => Promise<common.SuccessResponse>;
  switchUpsert: (payload: variant.SwitchRecord[]) => Promise<common.SuccessResponse>;

  // Vendor Price IPC handlers
  vendorPriceListActive: () => Promise<Envelope<variant.VendorPrice[]>>;
  vendorPriceListDeleted: () => Promise<Envelope<variant.VendorPrice[]>>;
  vendorPriceCreate: (payload: variant.CreateVendorPriceInput) => Promise<common.SuccessResponse>;
  vendorPriceUpdate: (payload: variant.UpdateVendorPriceInput) => Promise<common.SuccessResponse>;
  vendorPriceDelete: (payload: variant.VendorPriceId) => Promise<common.SuccessResponse>;
  vendorPriceRestore: (payload: variant.VendorPriceId) => Promise<common.SuccessResponse>;
  vendorPriceUpsert: (payload: variant.VendorPrice[]) => Promise<common.SuccessResponse>;

  // Request IPC handlers
  requestListActive: () => Promise<Envelope<order.Request[]>>;
  requestListDeleted: () => Promise<Envelope<order.Request[]>>;
  requestCreate: (payload: order.CreateRequestInput) => Promise<common.SuccessResponse>;
  requestUpdate: (payload: order.UpdateRequestInput) => Promise<common.SuccessResponse>;
  requestDelete: (payload: order.RequestId) => Promise<common.SuccessResponse>;
  requestRestore: (payload: order.RequestId) => Promise<common.SuccessResponse>;
  requestUpsert: (payload: order.Request[]) => Promise<common.SuccessResponse>;

  // Request Item IPC handlers
  requestItemListActive: () => Promise<Envelope<order.RequestItem[]>>;
  requestItemListDeleted: () => Promise<Envelope<order.RequestItem[]>>;
  requestItemCreate: (payload: order.CreateRequestItemInput) => Promise<common.SuccessResponse>;
  requestItemUpdate: (payload: order.UpdateRequestItemInput) => Promise<common.SuccessResponse>;
  requestItemDelete: (payload: order.RequestItemId) => Promise<common.SuccessResponse>;
  requestItemRestore: (payload: order.RequestItemId) => Promise<common.SuccessResponse>;
  requestItemUpsert: (payload: order.RequestItem[]) => Promise<common.SuccessResponse>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';
