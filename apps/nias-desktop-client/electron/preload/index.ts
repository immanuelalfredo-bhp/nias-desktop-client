import { contextBridge, ipcRenderer } from 'electron';
import { attribute, item, variant, order, system, local, server } from '@nias/shared';

contextBridge.exposeInMainWorld('electronAPI', {
  // User IPC handlers
  userListActive: () => ipcRenderer.invoke('user:list-active'),
  userListDeleted: () => ipcRenderer.invoke('user:list-deleted'),
  userGetSelf: () => ipcRenderer.invoke('user:get-self'),
  userCreate: (payload: system.CreateUserInput) => ipcRenderer.invoke('user:create', payload),
  userUpdate: (payload: system.UpdateUserInput) => ipcRenderer.invoke('user:update', payload),
  userDelete: (payload: string) => ipcRenderer.invoke('user:delete', payload),
  userRestore: (payload: string) => ipcRenderer.invoke('user:restore', payload),
  userUpsert: (payload: system.CreateUserPayload[]) => ipcRenderer.invoke('user:upsert', payload),

  // Audit IPC handlers
  auditList: () => ipcRenderer.invoke('audit:list'),

  // Brand IPC handlers
  brandListActive: () => ipcRenderer.invoke('brand:list-active'),
  brandListDeleted: () => ipcRenderer.invoke('brand:list-deleted'),
  brandCreate: (payload: attribute.CreateBrandInput) => ipcRenderer.invoke('brand:create', payload),
  brandUpdate: (payload: attribute.UpdateBrandInput) => ipcRenderer.invoke('brand:update', payload),
  brandDelete: (payload: string) => ipcRenderer.invoke('brand:delete', payload),
  brandRestore: (payload: string) => ipcRenderer.invoke('brand:restore', payload),
  brandUpsert: (payload: attribute.Brand[]) => ipcRenderer.invoke('brand:upsert', payload),
  brandGetByItemId: (itemId: string) => ipcRenderer.invoke('brand:get-by-item-id', itemId),

  // Mode IPC handlers
  modeListActive: () => ipcRenderer.invoke('mode:list-active'),
  modeListDeleted: () => ipcRenderer.invoke('mode:list-deleted'),
  modeCreate: (payload: attribute.CreateModeInput) => ipcRenderer.invoke('mode:create', payload),
  modeUpdate: (payload: attribute.UpdateModeInput) => ipcRenderer.invoke('mode:update', payload),
  modeDelete: (payload: string) => ipcRenderer.invoke('mode:delete', payload),
  modeRestore: (payload: string) => ipcRenderer.invoke('mode:restore', payload),
  modeUpsert: (payload: attribute.Mode[]) => ipcRenderer.invoke('mode:upsert', payload),
  modeGetByItemId: (itemId: string) => ipcRenderer.invoke('mode:get-by-item-id', itemId),
  modeGetByNorm: (normalizedName: string) => ipcRenderer.invoke('mode:get-by-norm', normalizedName),

  // UoM IPC handlers
  uomListActive: () => ipcRenderer.invoke('uom:list-active'),
  uomListDeleted: () => ipcRenderer.invoke('uom:list-deleted'),
  uomCreate: (payload: attribute.CreateUomInput) => ipcRenderer.invoke('uom:create', payload),
  uomUpdate: (payload: attribute.UpdateUomInput) => ipcRenderer.invoke('uom:update', payload),
  uomDelete: (payload: string) => ipcRenderer.invoke('uom:delete', payload),
  uomRestore: (payload: string) => ipcRenderer.invoke('uom:restore', payload),
  uomUpsert: (payload: attribute.Uom[]) => ipcRenderer.invoke('uom:upsert', payload),
  uomGetByItemId: (itemId: string) => ipcRenderer.invoke('uom:get-by-item-id', itemId),

  // Dimension IPC handlers
  dimensionListActive: () => ipcRenderer.invoke('dimension:list-active'),
  dimensionListDeleted: () => ipcRenderer.invoke('dimension:list-deleted'),
  dimensionGetById: (dimensionId: string) => ipcRenderer.invoke('dimension:get-by-id', dimensionId),
  dimensionCreate: (payload: attribute.CreateDimensionInput) =>
    ipcRenderer.invoke('dimension:create', payload),
  dimensionUpdate: (payload: attribute.UpdateDimensionInput) =>
    ipcRenderer.invoke('dimension:update', payload),
  dimensionDelete: (payload: string) => ipcRenderer.invoke('dimension:delete', payload),
  dimensionRestore: (payload: string) => ipcRenderer.invoke('dimension:restore', payload),
  dimensionUpsert: (payload: attribute.Dimension[]) =>
    ipcRenderer.invoke('dimension:upsert', payload),
  dimensionGetByItemId: (itemId: string) => ipcRenderer.invoke('dimension:get-by-item-id', itemId),

  // Dimension Value IPC handlers
  dimensionValueListActive: () => ipcRenderer.invoke('dimension-value:list-active'),
  dimensionValueListDeleted: () => ipcRenderer.invoke('dimension-value:list-deleted'),
  dimensionValueGetActiveByDimensionId: (dimensionId: string) =>
    ipcRenderer.invoke('dimension-value:get-active-by-dimension-id', dimensionId),
  dimensionValueGetDeletedByDimensionId: (dimensionId: string) =>
    ipcRenderer.invoke('dimension-value:get-deleted-by-dimension-id', dimensionId),
  dimensionValueGetIs: (dimensionId: string, value: string | number) =>
    ipcRenderer.invoke('dimension-value:get-is', dimensionId, value),
  dimensionValueGetBetween: (dimensionId: string, min: number, max: number) =>
    ipcRenderer.invoke('dimension-value:get-between', dimensionId, min, max),
  dimensionValueGetInclude: (dimensionId: string, values: (string | number)[]) =>
    ipcRenderer.invoke('dimension-value:get-include', dimensionId, values),
  dimensionValueCreate: (payload: attribute.CreateDimensionValueInput) =>
    ipcRenderer.invoke('dimension-value:create', payload),
  dimensionValueUpdate: (payload: attribute.UpdateDimensionValue) =>
    ipcRenderer.invoke('dimension-value:update', payload),
  dimensionValueDelete: (payload: string) => ipcRenderer.invoke('dimension-value:delete', payload),
  dimensionValueRestore: (payload: string) =>
    ipcRenderer.invoke('dimension-value:restore', payload),
  dimensionValueUpsert: (payload: attribute.DimensionValue[]) =>
    ipcRenderer.invoke('dimension-value:upsert', payload),
  dimensionValueGetByVariantIds: (variantIds: string[]) =>
    ipcRenderer.invoke('dimension-value:get-by-variant-ids', variantIds),

  // System IPC handlers
  systemListActive: () => ipcRenderer.invoke('system:list-active'),
  systemListDeleted: () => ipcRenderer.invoke('system:list-deleted'),
  systemCreate: (payload: attribute.CreateSystemInput) =>
    ipcRenderer.invoke('system:create', payload),
  systemUpdate: (payload: attribute.UpdateSystemInput) =>
    ipcRenderer.invoke('system:update', payload),
  systemDelete: (payload: string) => ipcRenderer.invoke('system:delete', payload),
  systemRestore: (payload: string) => ipcRenderer.invoke('system:restore', payload),
  systemUpsert: (payload: attribute.System[]) => ipcRenderer.invoke('system:upsert', payload),
  systemGetByItemId: (itemId: string) => ipcRenderer.invoke('system:get-by-item-id', itemId),

  // Category IPC handlers
  categoryListActive: () => ipcRenderer.invoke('category:list-active'),
  categoryListDeleted: () => ipcRenderer.invoke('category:list-deleted'),
  categoryCreate: (payload: attribute.CreateCategoryInput) =>
    ipcRenderer.invoke('category:create', payload),
  categoryUpdate: (payload: attribute.UpdateCategoryInput) =>
    ipcRenderer.invoke('category:update', payload),
  categoryDelete: (payload: string) => ipcRenderer.invoke('category:delete', payload),
  categoryRestore: (payload: string) => ipcRenderer.invoke('category:restore', payload),
  categoryUpsert: (payload: attribute.Category[]) => ipcRenderer.invoke('category:upsert', payload),
  categoryGetByNorm: (normalizedName: string) =>
    ipcRenderer.invoke('category:get-by-norm', normalizedName),

  // Vendor IPC handlers
  vendorListActive: () => ipcRenderer.invoke('vendor:list-active'),
  vendorListDeleted: () => ipcRenderer.invoke('vendor:list-deleted'),
  vendorCreate: (payload: attribute.CreateVendorInput) =>
    ipcRenderer.invoke('vendor:create', payload),
  vendorUpdate: (payload: attribute.UpdateVendorInput) =>
    ipcRenderer.invoke('vendor:update', payload),
  vendorDelete: (payload: string) => ipcRenderer.invoke('vendor:delete', payload),
  vendorRestore: (payload: string) => ipcRenderer.invoke('vendor:restore', payload),
  vendorUpsert: (payload: attribute.Vendor[]) => ipcRenderer.invoke('vendor:upsert', payload),

  // Tag IPC handlers
  tagListActive: () => ipcRenderer.invoke('tag:list-active'),
  tagListDeleted: () => ipcRenderer.invoke('tag:list-deleted'),
  tagCreate: (payload: attribute.CreateTagInput) => ipcRenderer.invoke('tag:create', payload),
  tagUpdate: (payload: attribute.UpdateTagInput) => ipcRenderer.invoke('tag:update', payload),
  tagDelete: (payload: string) => ipcRenderer.invoke('tag:delete', payload),
  tagRestore: (payload: string) => ipcRenderer.invoke('tag:restore', payload),
  tagUpsert: (payload: attribute.Tag[]) => ipcRenderer.invoke('tag:upsert', payload),
  tagGetByItemId: (itemId: string) => ipcRenderer.invoke('tag:get-by-item-id', itemId),

  // Item Record IPC handlers
  itemListActive: () => ipcRenderer.invoke('item:list-active'),
  itemListDeleted: () => ipcRenderer.invoke('item:list-deleted'),
  itemCreate: (payload: item.CreateItemRecordInput) => ipcRenderer.invoke('item:create', payload),
  itemUpdate: (payload: item.UpdateItemRecordInput) => ipcRenderer.invoke('item:update', payload),
  itemDelete: (payload: string) => ipcRenderer.invoke('item:delete', payload),
  itemRestore: (payload: string) => ipcRenderer.invoke('item:restore', payload),
  itemUpsert: (payload: item.ItemRecord[]) => ipcRenderer.invoke('item:upsert', payload),
  itemListCatalogue: (payload: boolean) => ipcRenderer.invoke('item:list-catalogue', payload),

  // Alias IPC handlers
  aliasListActive: () => ipcRenderer.invoke('alias:list-active'),
  aliasListDeleted: () => ipcRenderer.invoke('alias:list-deleted'),
  aliasCreate: (payload: item.CreateAliasInput) => ipcRenderer.invoke('alias:create', payload),
  aliasUpdate: (payload: item.UpdateAliasInput) => ipcRenderer.invoke('alias:update', payload),
  aliasDelete: (itemId: string, alias: string) => ipcRenderer.invoke('alias:delete', itemId, alias),
  aliasRestore: (itemId: string, alias: string) =>
    ipcRenderer.invoke('alias:restore', itemId, alias),
  aliasUpsert: (payload: item.Alias[]) => ipcRenderer.invoke('alias:upsert', payload),
  aliasGetByItemId: (itemId: string) => ipcRenderer.invoke('alias:get-by-item-id', itemId),

  // Dimension Map IPC handlers
  dimensionMapListActive: () => ipcRenderer.invoke('dimension-map:list-active'),
  dimensionMapListDeleted: () => ipcRenderer.invoke('dimension-map:list-deleted'),
  dimensionMapCreate: (payload: item.CreateDimensionMapInput) =>
    ipcRenderer.invoke('dimension-map:create', payload),
  dimensionMapUpdate: (payload: item.UpdateDimensionMap) =>
    ipcRenderer.invoke('dimension-map:update', payload),
  dimensionMapDelete: (itemId: string, dimensionId: string) =>
    ipcRenderer.invoke('dimension-map:delete', itemId, dimensionId),
  dimensionMapRestore: (itemId: string, dimensionId: string) =>
    ipcRenderer.invoke('dimension-map:restore', itemId, dimensionId),
  dimensionMapUpsert: (payload: item.DimensionMap[]) =>
    ipcRenderer.invoke('dimension-map:upsert', payload),

  // System Map IPC handlers
  systemMapListActive: () => ipcRenderer.invoke('system-map:list-active'),
  systemMapListDeleted: () => ipcRenderer.invoke('system-map:list-deleted'),
  systemMapCreate: (payload: item.CreateSystemMapInput) =>
    ipcRenderer.invoke('system-map:create', payload),
  systemMapUpdate: (payload: item.UpdateSystemMap) =>
    ipcRenderer.invoke('system-map:update', payload),
  systemMapDelete: (itemId: string, systemId: string) =>
    ipcRenderer.invoke('system-map:delete', itemId, systemId),
  systemMapRestore: (itemId: string, systemId: string) =>
    ipcRenderer.invoke('system-map:restore', itemId, systemId),
  systemMapUpsert: (payload: item.SystemMap[]) => ipcRenderer.invoke('system-map:upsert', payload),

  // Tag Map IPC handlers
  tagMapListActive: () => ipcRenderer.invoke('tag-map:list-active'),
  tagMapListDeleted: () => ipcRenderer.invoke('tag-map:list-deleted'),
  tagMapCreate: (payload: item.CreateTagMapInput) => ipcRenderer.invoke('tag-map:create', payload),
  tagMapUpdate: (payload: item.UpdateTagMap) => ipcRenderer.invoke('tag-map:update', payload),
  tagMapDelete: (itemId: string, tagId: string) =>
    ipcRenderer.invoke('tag-map:delete', itemId, tagId),
  tagMapRestore: (itemId: string, tagId: string) =>
    ipcRenderer.invoke('tag-map:restore', itemId, tagId),
  tagMapUpsert: (payload: item.TagMap[]) => ipcRenderer.invoke('tag-map:upsert', payload),

  // Generation Rules IPC handlers
  generationRuleListActive: () => ipcRenderer.invoke('generation-rule:list-active'),
  generationRuleListDeleted: () => ipcRenderer.invoke('generation-rule:list-deleted'),
  generationRuleListDirtyComponents: () =>
    ipcRenderer.invoke('generation-rule:list-dirty-components'),
  generationRuleListWithNames: (showActive: boolean) =>
    ipcRenderer.invoke('generation-rule:list-with-names', showActive),
  generationRuleCreate: (payload: item.CreateGenerationRuleInput) =>
    ipcRenderer.invoke('generation-rule:create', payload),
  generationRuleUpdate: (payload: item.UpdateGenerationRule) =>
    ipcRenderer.invoke('generation-rule:update', payload),
  generationRuleDelete: (payload: string) => ipcRenderer.invoke('generation-rule:delete', payload),
  generationRuleRestore: (payload: string) =>
    ipcRenderer.invoke('generation-rule:restore', payload),
  generationRuleUpsert: (payload: item.GenerationRules[]) =>
    ipcRenderer.invoke('generation-rule:upsert', payload),
  generationRuleMarkAsClean: (payload: string) =>
    ipcRenderer.invoke('generation-rule:mark-as-clean', payload),

  // Variant Generator IPC handlers
  variantGeneratorRun: () => ipcRenderer.invoke('variant-generator:run'),
  variantGeneratorUuid: (name: string, namespace: string) =>
    ipcRenderer.invoke('variant-generator:uuid', name, namespace),

  // Variant Record IPC handlers
  variantListActive: () => ipcRenderer.invoke('variant:list-active'),
  variantListDeleted: () => ipcRenderer.invoke('variant:list-deleted'),
  variantCreate: (payload: variant.CreateVariantRecordInput) =>
    ipcRenderer.invoke('variant:create', payload),
  variantUpdate: (payload: variant.UpdateVariantRecord) =>
    ipcRenderer.invoke('variant:update', payload),
  variantDelete: (payload: string) => ipcRenderer.invoke('variant:delete', payload),
  variantRestore: (payload: string) => ipcRenderer.invoke('variant:restore', payload),
  variantUpsert: (payload: variant.VariantRecord[]) =>
    ipcRenderer.invoke('variant:upsert', payload),
  variantGetBySpecifications: (
    itemId: string,
    brandId: string,
    modeId: string,
    uomId: string,
    dimensionValueIds: string[],
  ) =>
    ipcRenderer.invoke(
      'variant:get-by-specifications',
      itemId,
      brandId,
      modeId,
      uomId,
      dimensionValueIds,
    ),

  // Dimension Value Map IPC handlers
  dimensionValueMapListActive: () => ipcRenderer.invoke('dimension-value-map:list-active'),
  dimensionValueMapListDeleted: () => ipcRenderer.invoke('dimension-value-map:list-deleted'),
  dimensionValueMapCreate: (payload: variant.CreateDimensionValueMapInput) =>
    ipcRenderer.invoke('dimension-value-map:create', payload),
  dimensionValueMapUpdate: (payload: variant.UpdateDimensionValueMap) =>
    ipcRenderer.invoke('dimension-value-map:update', payload),
  dimensionValueMapDelete: (payload: string) =>
    ipcRenderer.invoke('dimension-value-map:delete', payload),
  dimensionValueMapRestore: (payload: string) =>
    ipcRenderer.invoke('dimension-value-map:restore', payload),
  dimensionValueMapUpsert: (payload: variant.DimensionValueMap[]) =>
    ipcRenderer.invoke('dimension-value-map:upsert', payload),

  // Request Item IPC handlers
  requestItemListActive: () => ipcRenderer.invoke('request-item:list-active'),
  requestItemListDeleted: () => ipcRenderer.invoke('request-item:list-deleted'),
  requestItemCreate: (payload: order.CreateRequestItemInput) =>
    ipcRenderer.invoke('request-item:create', payload),
  requestItemUpdate: (payload: order.UpdateRequestItem) =>
    ipcRenderer.invoke('request-item:update', payload),
  requestItemDelete: (payload: string) => ipcRenderer.invoke('request-item:delete', payload),
  requestItemRestore: (payload: string) => ipcRenderer.invoke('request-item:restore', payload),
  requestItemUpsert: (payload: order.RequestItem[]) =>
    ipcRenderer.invoke('request-item:upsert', payload),
  requestItemListWithInfo: () => ipcRenderer.invoke('request-item:list-with-info'),
  requestItemHardDelete: (payload: string) => ipcRenderer.invoke('request-item:hard-delete', payload),
  requestItemEditQuantity: (payload: { id: string; newQuantity: number }) =>
    ipcRenderer.invoke('request-item:edit-quantity', payload),
  requestItemClear: () => ipcRenderer.invoke('request-item:clear'),

  // Authentication IPC handlers
  authStatus: () => ipcRenderer.invoke('auth:status'),
  authLogin: (payload: { email: string; password: string }) =>
    ipcRenderer.invoke('auth:login', payload),
  authSync: () => ipcRenderer.invoke('auth:sync'),
  authLogout: () => ipcRenderer.invoke('auth:logout'),

  // Bootstrap IPC handlers
  bootstrapStatus: () => ipcRenderer.invoke('bootstrap:status'),
  bootstrapExecute: (payload: local.BootstrapInput) =>
    ipcRenderer.invoke('bootstrap:execute', payload),

  // Sync IPC handlers
  syncRun: () => ipcRenderer.invoke('sync:run'),

  // Export IPC handlers
  exportRequest: () => ipcRenderer.invoke('export:request'),

  // Update IPC handlers
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstall: () => ipcRenderer.invoke('update:quit-and-install'),
  onUpdateStatus: (callback: (status: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
});
