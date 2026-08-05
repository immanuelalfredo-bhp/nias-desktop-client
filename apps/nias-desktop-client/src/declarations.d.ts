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
  userDelete: (payload: string) => Promise<common.SuccessResponse>;
  userRestore: (payload: string) => Promise<common.SuccessResponse>;
  userUpsert: (payload: system.User[]) => Promise<common.SuccessResponse>;
  userUpdatePassword: (payload: system.UpdateUserPasswordInput) => Promise<common.SuccessResponse>;

  // Role IPC handlers
  roleListActive: () => Promise<Envelope<system.Role[]>>;
  roleListDeleted: () => Promise<Envelope<system.Role[]>>;
  roleCreate: (payload: system.CreateRoleInput) => Promise<common.SuccessResponse>;
  roleUpdate: (payload: system.UpdateRoleInput) => Promise<common.SuccessResponse>;
  roleDelete: (payload: string) => Promise<common.SuccessResponse>;
  roleRestore: (payload: string) => Promise<common.SuccessResponse>;
  roleUpsert: (payload: system.Role[]) => Promise<common.SuccessResponse>;

  // Project IPC handlers
  projectListActive: () => Promise<Envelope<system.Project[]>>;
  projectListDeleted: () => Promise<Envelope<system.Project[]>>;
  projectCreate: (payload: system.CreateProjectInput) => Promise<common.SuccessResponse>;
  projectUpdate: (payload: system.UpdateProjectInput) => Promise<common.SuccessResponse>;
  projectDelete: (payload: string) => Promise<common.SuccessResponse>;
  projectRestore: (payload: string) => Promise<common.SuccessResponse>;
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
  roleCapabilityDelete: (payload: string) => Promise<common.SuccessResponse>;
  roleCapabilityRestore: (payload: string) => Promise<common.SuccessResponse>;
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
  roleManagementDelete: (payload: string) => Promise<common.SuccessResponse>;
  roleManagementRestore: (payload: string) => Promise<common.SuccessResponse>;
  roleManagementUpsert: (payload: system.RoleManagement[]) => Promise<common.SuccessResponse>;

  // Role Map IPC handlers
  roleMapListActive: () => Promise<Envelope<system.RoleMap[]>>;
  roleMapListDeleted: () => Promise<Envelope<system.RoleMap[]>>;
  roleMapCreate: (payload: system.CreateRoleMapInput) => Promise<common.SuccessResponse>;
  roleMapUpdate: (payload: system.UpdateRoleMapInput) => Promise<common.SuccessResponse>;
  roleMapDelete: (payload: string) => Promise<common.SuccessResponse>;
  roleMapRestore: (payload: string) => Promise<common.SuccessResponse>;
  roleMapUpsert: (payload: system.RoleMap[]) => Promise<common.SuccessResponse>;

  // Project Map IPC handlers
  projectMapListActive: () => Promise<Envelope<system.ProjectMap[]>>;
  projectMapListDeleted: () => Promise<Envelope<system.ProjectMap[]>>;
  projectMapCreate: (payload: system.CreateProjectMapInput) => Promise<common.SuccessResponse>;
  projectMapUpdate: (payload: system.UpdateProjectMapInput) => Promise<common.SuccessResponse>;
  projectMapDelete: (payload: string) => Promise<common.SuccessResponse>;
  projectMapRestore: (payload: string) => Promise<common.SuccessResponse>;
  projectMapUpsert: (payload: system.ProjectMap[]) => Promise<common.SuccessResponse>;

  // Audit IPC handlers
  auditList: () => Promise<Envelope<system.Audit[]>>;

  // Brand IPC handlers
  brandListActive: () => Promise<Envelope<attribute.Brand[]>>;
  brandListDeleted: () => Promise<Envelope<attribute.Brand[]>>;
  brandCreate: (payload: attribute.CreateBrandInput) => Promise<common.SuccessResponse>;
  brandUpdate: (payload: attribute.UpdateBrandInput) => Promise<common.SuccessResponse>;
  brandDelete: (payload: string) => Promise<common.SuccessResponse>;
  brandRestore: (payload: string) => Promise<common.SuccessResponse>;
  brandUpsert: (payload: attribute.Brand[]) => Promise<common.SuccessResponse>;
  brandGetByItemId: (itemId: string) => Promise<Envelope<attribute.Brand[]>>;

  // Mode IPC handlers
  modeListActive: () => Promise<Envelope<attribute.Mode[]>>;
  modeListDeleted: () => Promise<Envelope<attribute.Mode[]>>;
  modeCreate: (payload: attribute.CreateModeInput) => Promise<common.SuccessResponse>;
  modeUpdate: (payload: attribute.UpdateModeInput) => Promise<common.SuccessResponse>;
  modeDelete: (payload: string) => Promise<common.SuccessResponse>;
  modeRestore: (payload: string) => Promise<common.SuccessResponse>;
  modeUpsert: (payload: attribute.Mode[]) => Promise<common.SuccessResponse>;
  modeGetByItemId: (itemId: string) => Promise<Envelope<attribute.Mode[]>>;
  modeGetByNorm: (normalizedName: string) => Promise<Envelope<attribute.Mode>>;

  // UoM IPC handlers
  uomListActive: () => Promise<Envelope<attribute.Uom[]>>;
  uomListDeleted: () => Promise<Envelope<attribute.Uom[]>>;
  uomCreate: (payload: attribute.CreateUomInput) => Promise<common.SuccessResponse>;
  uomUpdate: (payload: attribute.UpdateUomInput) => Promise<common.SuccessResponse>;
  uomDelete: (payload: string) => Promise<common.SuccessResponse>;
  uomRestore: (payload: string) => Promise<common.SuccessResponse>;
  uomUpsert: (payload: attribute.Uom[]) => Promise<common.SuccessResponse>;
  uomGetByItemId: (itemId: string) => Promise<Envelope<attribute.Uom[]>>;

  // Dimension IPC handlers
  dimensionListActive: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionListDeleted: () => Promise<Envelope<attribute.Dimension[]>>;
  dimensionCreate: (payload: attribute.CreateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) => Promise<common.SuccessResponse>;
  dimensionDelete: (payload: string) => Promise<common.SuccessResponse>;
  dimensionRestore: (payload: string) => Promise<common.SuccessResponse>;
  dimensionUpsert: (payload: attribute.Dimension[]) => Promise<common.SuccessResponse>;
  dimensionGetByItemId: (itemId: string) => Promise<Envelope<attribute.Dimension[]>>;

  // Dimension Value IPC handlers
  dimensionValueListActive: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueListDeleted: () => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueGetByDimensionId: (
    dimensionId: string,
  ) => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueGetActiveByDimensionId: (
    dimensionId: string,
  ) => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueGetDeletedByDimensionId: (
    dimensionId: string,
  ) => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueGetIs: (
    dimensionId: string,
    value: string | number,
  ) => Promise<Envelope<attribute.DimensionValue>>;
  dimensionValueGetBetween: (
    dimensionId: string,
    min: number,
    max: number,
  ) => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueGetInclude: (
    dimensionId: string,
    values: (string | number)[],
  ) => Promise<Envelope<attribute.DimensionValue[]>>;
  dimensionValueCreate: (
    payload: attribute.CreateDimensionValueInput,
  ) => Promise<common.SuccessResponse>;
  dimensionValueUpdate: (
    payload: attribute.UpdateDimensionValue,
  ) => Promise<common.SuccessResponse>;
  dimensionValueDelete: (payload: string) => Promise<common.SuccessResponse>;
  dimensionValueRestore: (payload: string) => Promise<common.SuccessResponse>;
  dimensionValueUpsert: (payload: attribute.DimensionValue[]) => Promise<common.SuccessResponse>;
  dimensionValueGetByVariantIds: (variantIds: string[]) => Promise<Envelope<any[]>>;

  // System IPC handlers
  systemListActive: () => Promise<Envelope<attribute.System[]>>;
  systemListDeleted: () => Promise<Envelope<attribute.System[]>>;
  systemCreate: (payload: attribute.CreateSystemInput) => Promise<common.SuccessResponse>;
  systemUpdate: (payload: attribute.UpdateSystemInput) => Promise<common.SuccessResponse>;
  systemDelete: (payload: string) => Promise<common.SuccessResponse>;
  systemRestore: (payload: string) => Promise<common.SuccessResponse>;
  systemUpsert: (payload: attribute.System[]) => Promise<common.SuccessResponse>;
  systemGetByItemId: (itemId: string) => Promise<Envelope<attribute.System[]>>;

  // Category IPC handlers
  categoryListActive: () => Promise<Envelope<attribute.Category[]>>;
  categoryListDeleted: () => Promise<Envelope<attribute.Category[]>>;
  categoryCreate: (payload: attribute.CreateCategoryInput) => Promise<common.SuccessResponse>;
  categoryUpdate: (payload: attribute.UpdateCategoryInput) => Promise<common.SuccessResponse>;
  categoryDelete: (payload: string) => Promise<common.SuccessResponse>;
  categoryRestore: (payload: string) => Promise<common.SuccessResponse>;
  categoryUpsert: (payload: attribute.Category[]) => Promise<common.SuccessResponse>;
  categoryGetByNorm: (normalizedName: string) => Promise<Envelope<attribute.Category>>;

  // Vendor IPC handlers
  vendorListActive: () => Promise<Envelope<attribute.Vendor[]>>;
  vendorListDeleted: () => Promise<Envelope<attribute.Vendor[]>>;
  vendorCreate: (payload: attribute.CreateVendorInput) => Promise<common.SuccessResponse>;
  vendorUpdate: (payload: attribute.UpdateVendorInput) => Promise<common.SuccessResponse>;
  vendorDelete: (payload: string) => Promise<common.SuccessResponse>;
  vendorRestore: (payload: string) => Promise<common.SuccessResponse>;
  vendorUpsert: (payload: attribute.Vendor[]) => Promise<common.SuccessResponse>;

  // Tag IPC handlers
  tagListActive: () => Promise<Envelope<attribute.Tag[]>>;
  tagListDeleted: () => Promise<Envelope<attribute.Tag[]>>;
  tagCreate: (payload: attribute.CreateTagInput) => Promise<common.SuccessResponse>;
  tagUpdate: (payload: attribute.UpdateTagInput) => Promise<common.SuccessResponse>;
  tagDelete: (payload: string) => Promise<common.SuccessResponse>;
  tagRestore: (payload: string) => Promise<common.SuccessResponse>;
  tagUpsert: (payload: attribute.Tag[]) => Promise<common.SuccessResponse>;
  tagGetByItemId: (itemId: string) => Promise<Envelope<attribute.Tag[]>>;

  // Item Record IPC handlers
  itemListActive: () => Promise<Envelope<item.ItemRecord[]>>;
  itemListDeleted: () => Promise<Envelope<item.ItemRecord[]>>;
  itemCreate: (payload: item.CreateItemRecordInput) => Promise<Envelope<item.ItemRecordId>>;
  itemUpdate: (payload: item.UpdateItemRecordInput) => Promise<common.SuccessResponse>;
  itemDelete: (payload: string) => Promise<common.SuccessResponse>;
  itemRestore: (payload: string) => Promise<common.SuccessResponse>;
  itemUpsert: (payload: item.ItemRecord[]) => Promise<common.SuccessResponse>;
  itemListCatalogue: (payload: boolean) => Promise<Envelope<any[]>>;

  // Alias IPC handlers
  aliasListActive: () => Promise<Envelope<item.Alias[]>>;
  aliasListDeleted: () => Promise<Envelope<item.Alias[]>>;
  aliasCreate: (payload: item.CreateAliasInput) => Promise<common.SuccessResponse>;
  aliasUpdate: (payload: item.UpdateAliasInput) => Promise<common.SuccessResponse>;
  aliasDelete: (itemId: string, alias: string) => Promise<common.SuccessResponse>;
  aliasRestore: (itemId: string, alias: string) => Promise<common.SuccessResponse>;
  aliasUpsert: (payload: item.Alias[]) => Promise<common.SuccessResponse>;
  aliasGetByItemId: (itemId: string) => Promise<Envelope<item.Alias[]>>;

  // System Map IPC handlers
  systemMapListActive: () => Promise<Envelope<item.SystemMap[]>>;
  systemMapListDeleted: () => Promise<Envelope<item.SystemMap[]>>;
  systemMapCreate: (payload: item.CreateSystemMapInput) => Promise<common.SuccessResponse>;
  systemMapUpdate: (payload: item.UpdateSystemMapInput) => Promise<common.SuccessResponse>;
  systemMapDelete: (itemId: string, systemId: string) => Promise<common.SuccessResponse>;
  systemMapRestore: (itemId: string, systemId: string) => Promise<common.SuccessResponse>;
  systemMapUpsert: (payload: item.SystemMap[]) => Promise<common.SuccessResponse>;

  // Tag Map IPC handlers
  tagMapListActive: () => Promise<Envelope<item.TagMap[]>>;
  tagMapListDeleted: () => Promise<Envelope<item.TagMap[]>>;
  tagMapCreate: (payload: item.CreateTagMapInput) => Promise<common.SuccessResponse>;
  tagMapUpdate: (payload: item.UpdateTagMapInput) => Promise<common.SuccessResponse>;
  tagMapDelete: (itemId: string, tagId: string) => Promise<common.SuccessResponse>;
  tagMapRestore: (itemId: string, tagId: string) => Promise<common.SuccessResponse>;
  tagMapUpsert: (payload: item.TagMap[]) => Promise<common.SuccessResponse>;

  // Vendor Map IPC handlers
  vendorMapListActive: () => Promise<Envelope<item.VendorMap[]>>;
  vendorMapListDeleted: () => Promise<Envelope<item.VendorMap[]>>;
  vendorMapCreate: (payload: item.CreateVendorMapInput) => Promise<common.SuccessResponse>;
  vendorMapUpdate: (payload: item.UpdateVendorMapInput) => Promise<common.SuccessResponse>;
  vendorMapDelete: (ruleId: string, vendorId: string) => Promise<common.SuccessResponse>;
  vendorMapRestore: (ruleId: string, vendorId: string) => Promise<common.SuccessResponse>;
  vendorMapUpsert: (payload: item.VendorMap[]) => Promise<common.SuccessResponse>;
  vendorMapGetByVendorId: (vendorId: string) => Promise<Envelope<item.VendorMap[]>>;

  // Generation Rule IPC handlers
  generationRuleListActive: () => Promise<Envelope<item.GenerationRules[]>>;
  generationRuleListDeleted: () => Promise<Envelope<item.GenerationRules[]>>;
  generationRuleListDirtyComponents: () => Promise<Envelope<item.GenerationRules[]>>;
  generationRuleListWithNames: (showActive: boolean) => Promise<Envelope<any[]>>;
  generationRuleCreate: (
    payload: item.CreateGenerationRuleInput,
  ) => Promise<common.SuccessResponse>;
  generationRuleUpdate: (
    payload: item.UpdateGenerationRuleInput,
  ) => Promise<common.SuccessResponse>;
  generationRuleDelete: (payload: string) => Promise<common.SuccessResponse>;
  generationRuleRestore: (payload: string) => Promise<common.SuccessResponse>;
  generationRuleUpsert: (payload: item.GenerationRules[]) => Promise<common.SuccessResponse>;
  generationRuleMarkAsClean: (payload: string) => Promise<common.SuccessResponse>;

  // Variant Generator IPC handlers
  variantGeneratorRun: () => Promise<common.SuccessResponse>;
  variantGeneratorUuid: (name: string, namespace: string) => Promise<Envelope<string>>;

  // Variant IPC handlers
  variantListActive: () => Promise<Envelope<variant.VariantRecord[]>>;
  variantListDeleted: () => Promise<Envelope<variant.VariantRecord[]>>;
  variantCreate: (payload: variant.CreateVariantRecordInput) => Promise<common.SuccessResponse>;
  variantUpdate: (payload: variant.UpdateVariantRecordInput) => Promise<common.SuccessResponse>;
  variantDelete: (payload: string) => Promise<common.SuccessResponse>;
  variantRestore: (payload: string) => Promise<common.SuccessResponse>;
  variantUpsert: (payload: variant.VariantRecord[]) => Promise<common.SuccessResponse>;
  variantGetBySpecifications: (
    itemId: string,
    brandId: string,
    modeId: string,
    uomId: string,
    dimensionValueIds: string[],
  ) => Promise<Envelope<variant.VariantRecord[]>>;

  // Component IPC handlers
  componentListActive: () => Promise<Envelope<variant.ComponentRecord[]>>;
  componentListDeleted: () => Promise<Envelope<variant.ComponentRecord[]>>;
  componentCreate: (payload: variant.CreateComponentRecordInput) => Promise<common.SuccessResponse>;
  componentUpdate: (payload: variant.UpdateComponentRecordInput) => Promise<common.SuccessResponse>;
  componentDelete: (payload: string) => Promise<common.SuccessResponse>;
  componentRestore: (payload: string) => Promise<common.SuccessResponse>;
  componentUpsert: (payload: variant.ComponentRecord[]) => Promise<common.SuccessResponse>;

  // Dimension Map IPC handlers
  dimensionMapListActive: () => Promise<Envelope<variant.DimensionMap[]>>;
  dimensionMapListDeleted: () => Promise<Envelope<variant.DimensionMap[]>>;
  dimensionMapCreate: (payload: variant.CreateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapUpdate: (payload: variant.UpdateDimensionMapInput) => Promise<common.SuccessResponse>;
  dimensionMapDelete: (itemId: string, dimensionId: string) => Promise<common.SuccessResponse>;
  dimensionMapRestore: (itemId: string, dimensionId: string) => Promise<common.SuccessResponse>;
  dimensionMapUpsert: (payload: variant.DimensionMap[]) => Promise<common.SuccessResponse>;

  // Dimension Value Map IPC handlers
  dimensionValueMapListActive: () => Promise<Envelope<variant.DimensionValueMap[]>>;
  dimensionValueMapListDeleted: () => Promise<Envelope<variant.DimensionValueMap[]>>;
  dimensionValueMapCreate: (
    payload: variant.CreateDimensionValueMapInput,
  ) => Promise<common.SuccessResponse>;
  dimensionValueMapUpdate: (
    payload: variant.UpdateDimensionValueMapInput,
  ) => Promise<common.SuccessResponse>;
  dimensionValueMapDelete: (
    variantId: string,
    dimensionValueId: string,
  ) => Promise<common.SuccessResponse>;
  dimensionValueMapRestore: (
    variantId: string,
    dimensionValueId: string,
  ) => Promise<common.SuccessResponse>;
  dimensionValueMapUpsert: (
    payload: variant.DimensionValueMap[],
  ) => Promise<common.SuccessResponse>;

  // Switch IPC handlers
  switchListActive: () => Promise<Envelope<variant.SwitchRecord[]>>;
  switchListDeleted: () => Promise<Envelope<variant.SwitchRecord[]>>;
  switchCreate: (payload: variant.CreateSwitchRecordInput) => Promise<common.SuccessResponse>;
  switchUpdate: (payload: variant.UpdateSwitchRecordInput) => Promise<common.SuccessResponse>;
  switchDelete: (payload: string) => Promise<common.SuccessResponse>;
  switchRestore: (payload: string) => Promise<common.SuccessResponse>;
  switchUpsert: (payload: variant.SwitchRecord[]) => Promise<common.SuccessResponse>;

  // Vendor Price IPC handlers
  vendorPriceListActive: () => Promise<Envelope<variant.VendorPrice[]>>;
  vendorPriceListDeleted: () => Promise<Envelope<variant.VendorPrice[]>>;
  vendorPriceCreate: (payload: variant.CreateVendorPriceInput) => Promise<common.SuccessResponse>;
  vendorPriceUpdate: (payload: variant.UpdateVendorPriceInput) => Promise<common.SuccessResponse>;
  vendorPriceDelete: (payload: string) => Promise<common.SuccessResponse>;
  vendorPriceRestore: (payload: string) => Promise<common.SuccessResponse>;
  vendorPriceUpsert: (payload: variant.VendorPrice[]) => Promise<common.SuccessResponse>;

  // Request IPC handlers
  requestListActive: () => Promise<Envelope<order.Request[]>>;
  requestListDeleted: () => Promise<Envelope<order.Request[]>>;
  requestCreate: (payload: order.CreateRequestInput) => Promise<common.SuccessResponse>;
  requestUpdate: (payload: order.UpdateRequestInput) => Promise<common.SuccessResponse>;
  requestDelete: (payload: string) => Promise<common.SuccessResponse>;
  requestRestore: (payload: string) => Promise<common.SuccessResponse>;
  requestUpsert: (payload: order.Request[]) => Promise<common.SuccessResponse>;

  // Request Item IPC handlers
  requestItemListActive: () => Promise<Envelope<order.RequestItem[]>>;
  requestItemListDeleted: () => Promise<Envelope<order.RequestItem[]>>;
  requestItemCreate: (payload: order.CreateRequestItemInput) => Promise<common.SuccessResponse>;
  requestItemUpdate: (payload: order.UpdateRequestItemInput) => Promise<common.SuccessResponse>;
  requestItemDelete: (payload: string) => Promise<common.SuccessResponse>;
  requestItemRestore: (payload: string) => Promise<common.SuccessResponse>;
  requestItemUpsert: (payload: order.RequestItem[]) => Promise<common.SuccessResponse>;
  requestItemListWithInfo: () => Promise<Envelope<any[]>>;
  requestItemHardDelete: (payload: string) => Promise<common.SuccessResponse>;
  requestItemEditQuantity: (payload: {
    id: string;
    newQuantity: number;
  }) => Promise<common.SuccessResponse>;

  // Authentication IPC handlers
  authStatus: () => Promise<Envelope<local.BootstrapStatus>>;
  authLogin: (payload: {
    email: string;
    password: string;
  }) => Promise<Envelope<common.SuccessResponse>>;
  authSync: () => Promise<Envelope<common.SuccessResponse>>;
  authLogout: () => Promise<common.SuccessResponse>;

  // Bootstrap IPC handlers
  bootstrapStatus: () => Promise<Envelope<local.BootstrapStatus>>;
  bootstrapExecute: (payload: local.BootstrapInput) => Promise<common.SuccessResponse>;

  // Sync IPC handlers
  syncPull: () => Promise<Envelope<server.PullResponse>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css';
declare module '*.css?inline';
