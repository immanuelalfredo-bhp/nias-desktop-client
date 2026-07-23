import { attribute } from '@nias/shared';
import { z } from 'zod';

export type AttributeEntityKey =
  | 'brand'
  | 'category'
  | 'dimension'
  | 'dimensionValue'
  | 'mode'
  | 'system'
  | 'tag'
  | 'uom'
  | 'vendor';

export interface TableColumn {
  key: string;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldOverride {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption[];
  step?: string;
}

export interface AttributeEntityDefinition {
  key: AttributeEntityKey;
  label: string;
  createLabel: string;
  updateLabel: string;
  searchPlaceholder: string;
  searchKeys: string[];
  columns: TableColumn[];
  createSchema: z.ZodObject<any>;
  updateSchema: z.ZodObject<any>;
  fieldOverrides?: Record<string, FieldOverride>;
  createPayload: (values: Record<string, unknown>) => Record<string, unknown>;
  updatePayload: (id: string, values: Record<string, unknown>) => Record<string, unknown>;
}

export interface AttributeCrudFactory {
  listActive: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
  listDeleted: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
  create: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  update: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  delete: (payload: { id: string }) => Promise<{ success: boolean; message?: string }>;
  restore: (payload: { id: string }) => Promise<{ success: boolean; message?: string }>;
}

function normalizeName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function toStringValue(value: unknown): string {
  return String(value ?? '').trim();
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number.parseFloat(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumberValue(value: unknown): number | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function createCrudFactory(handlers: {
  listActive: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
  listDeleted: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
  create: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  update: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  delete: (payload: { id: string }) => Promise<{ success: boolean; message?: string }>;
  restore: (payload: { id: string }) => Promise<{ success: boolean; message?: string }>;
}): AttributeCrudFactory {
  return handlers;
}

export function buildAttributeCrudFactories(): Record<AttributeEntityKey, AttributeCrudFactory> {
  return {
    brand: createCrudFactory({
      listActive: () => window.electronAPI.brandListActive(),
      listDeleted: () => window.electronAPI.brandListDeleted(),
      create: (payload) => window.electronAPI.brandCreate(payload as attribute.CreateBrand),
      update: (payload) => window.electronAPI.brandUpdate(payload as attribute.UpdateBrand),
      delete: (payload) => window.electronAPI.brandDelete(payload),
      restore: (payload) => window.electronAPI.brandRestore(payload),
    }),
    category: createCrudFactory({
      listActive: () => window.electronAPI.categoryListActive(),
      listDeleted: () => window.electronAPI.categoryListDeleted(),
      create: (payload) => window.electronAPI.categoryCreate(payload as attribute.CreateCategory),
      update: (payload) => window.electronAPI.categoryUpdate(payload as attribute.UpdateCategory),
      delete: (payload) => window.electronAPI.categoryDelete(payload),
      restore: (payload) => window.electronAPI.categoryRestore(payload),
    }),
    dimension: createCrudFactory({
      listActive: () => window.electronAPI.dimensionListActive(),
      listDeleted: () => window.electronAPI.dimensionListDeleted(),
      create: (payload) => window.electronAPI.dimensionCreate(payload as attribute.CreateDimension),
      update: (payload) => window.electronAPI.dimensionUpdate(payload as attribute.UpdateDimension),
      delete: (payload) => window.electronAPI.dimensionDelete(payload),
      restore: (payload) => window.electronAPI.dimensionRestore(payload),
    }),
    dimensionValue: createCrudFactory({
      listActive: () => window.electronAPI.dimensionValueListActive(),
      listDeleted: () => window.electronAPI.dimensionValueListDeleted(),
      create: (payload) =>
        window.electronAPI.dimensionValueCreate(payload as attribute.CreateDimensionValue),
      update: (payload) =>
        window.electronAPI.dimensionValueUpdate(payload as attribute.UpdateDimensionValue),
      delete: (payload) => window.electronAPI.dimensionValueDelete(payload),
      restore: (payload) => window.electronAPI.dimensionValueRestore(payload),
    }),
    mode: createCrudFactory({
      listActive: () => window.electronAPI.modeListActive(),
      listDeleted: () => window.electronAPI.modeListDeleted(),
      create: (payload) => window.electronAPI.modeCreate(payload as attribute.CreateMode),
      update: (payload) => window.electronAPI.modeUpdate(payload as attribute.UpdateMode),
      delete: (payload) => window.electronAPI.modeDelete(payload),
      restore: (payload) => window.electronAPI.modeRestore(payload),
    }),
    system: createCrudFactory({
      listActive: () => window.electronAPI.systemListActive(),
      listDeleted: () => window.electronAPI.systemListDeleted(),
      create: (payload) => window.electronAPI.systemCreate(payload as attribute.CreateSystem),
      update: (payload) => window.electronAPI.systemUpdate(payload as attribute.UpdateSystem),
      delete: (payload) => window.electronAPI.systemDelete(payload),
      restore: (payload) => window.electronAPI.systemRestore(payload),
    }),
    tag: createCrudFactory({
      listActive: () => window.electronAPI.tagListActive(),
      listDeleted: () => window.electronAPI.tagListDeleted(),
      create: (payload) => window.electronAPI.tagCreate(payload as attribute.CreateTag),
      update: (payload) => window.electronAPI.tagUpdate(payload as attribute.UpdateTag),
      delete: (payload) => window.electronAPI.tagDelete(payload),
      restore: (payload) => window.electronAPI.tagRestore(payload),
    }),
    uom: createCrudFactory({
      listActive: () => window.electronAPI.uomListActive(),
      listDeleted: () => window.electronAPI.uomListDeleted(),
      create: (payload) => window.electronAPI.uomCreate(payload as attribute.CreateUom),
      update: (payload) => window.electronAPI.uomUpdate(payload as attribute.UpdateUom),
      delete: (payload) => window.electronAPI.uomDelete(payload),
      restore: (payload) => window.electronAPI.uomRestore(payload),
    }),
    vendor: createCrudFactory({
      listActive: () => window.electronAPI.vendorListActive(),
      listDeleted: () => window.electronAPI.vendorListDeleted(),
      create: (payload) => window.electronAPI.vendorCreate(payload as attribute.CreateVendor),
      update: (payload) => window.electronAPI.vendorUpdate(payload as attribute.UpdateVendor),
      delete: (payload) => window.electronAPI.vendorDelete(payload),
      restore: (payload) => window.electronAPI.vendorRestore(payload),
    }),
  };
}

export const attributeEntityDefinitions: Record<AttributeEntityKey, AttributeEntityDefinition> = {
  brand: {
    key: 'brand',
    label: 'Brands',
    createLabel: 'Add Brand',
    updateLabel: 'Edit Brand',
    searchPlaceholder: 'Search by SKU or name',
    searchKeys: ['skuCode', 'name', 'normalizedName'],
    columns: [
      { key: 'skuCode', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateBrandInputSchema,
    updateSchema: attribute.UpdateBrandInputSchema,
    fieldOverrides: {
      skuCode: { label: 'SKU', placeholder: 'AB' },
      name: { label: 'Name', placeholder: 'Brand name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  category: {
    key: 'category',
    label: 'Categories',
    createLabel: 'Add Category',
    updateLabel: 'Edit Category',
    searchPlaceholder: 'Search by name',
    searchKeys: ['name', 'normalizedName'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateCategoryInputSchema,
    updateSchema: attribute.UpdateCategoryInputSchema,
    fieldOverrides: {
      name: { label: 'Name', placeholder: 'Category name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  dimension: {
    key: 'dimension',
    label: 'Dimensions',
    createLabel: 'Add Dimension',
    updateLabel: 'Edit Dimension',
    searchPlaceholder: 'Search by name or form name',
    searchKeys: ['name', 'normalizedName', 'formName', 'scope', 'position'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'scope', label: 'Scope' },
      { key: 'formName', label: 'Form Name' },
      { key: 'position', label: 'Position' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateDimensionInputSchema,
    updateSchema: attribute.UpdateDimensionInputSchema,
    fieldOverrides: {
      name: { label: 'Name', placeholder: 'Dimension name' },
      scope: {
        label: 'Scope',
        type: 'select',
        options: [
          { value: 'global', label: 'Global' },
          { value: 'contextual', label: 'Contextual' },
        ],
      },
      formName: { label: 'Form Name', placeholder: 'Display name' },
      position: {
        label: 'Position',
        type: 'select',
        options: [
          { value: 'prefix', label: 'Prefix' },
          { value: 'suffix', label: 'Suffix' },
          { value: 'dimensions', label: 'Dimensions' },
          { value: 'end', label: 'End' },
        ],
      },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      scope: toStringValue(values.scope),
      formName: toStringValue(values.formName),
      position: toStringValue(values.position),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      scope: toStringValue(values.scope),
      formName: toStringValue(values.formName),
      position: toStringValue(values.position),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  dimensionValue: {
    key: 'dimensionValue',
    label: 'Dimension Values',
    createLabel: 'Add Dimension Value',
    updateLabel: 'Edit Dimension Value',
    searchPlaceholder: 'Search by SKU or name',
    searchKeys: ['name', 'skuCode', 'dimensionId'],
    columns: [
      { key: 'dimensionId', label: 'Dimension ID' },
      { key: 'skuCode', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'numericValue', label: 'Numeric Value' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateDimensionValueInputSchema,
    updateSchema: attribute.UpdateDimensionValueSchema,
    fieldOverrides: {
      dimensionId: { label: 'Dimension ID', placeholder: 'UUID' },
      skuCode: { label: 'SKU', placeholder: 'SKU' },
      name: { label: 'Name', placeholder: 'Dimension value name' },
      numericValue: { label: 'Numeric Value', type: 'number', step: '0.01' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      dimensionId: toStringValue(values.dimensionId),
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      numericValue: toNullableNumberValue(values.numericValue),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      dimensionId: toStringValue(values.dimensionId),
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      numericValue: toNullableNumberValue(values.numericValue),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  mode: {
    key: 'mode',
    label: 'Modes',
    createLabel: 'Add Mode',
    updateLabel: 'Edit Mode',
    searchPlaceholder: 'Search by name',
    searchKeys: ['name', 'normalizedName'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateModeInputSchema,
    updateSchema: attribute.UpdateModeInputSchema,
    fieldOverrides: {
      name: { label: 'Name', placeholder: 'Mode name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  system: {
    key: 'system',
    label: 'Systems',
    createLabel: 'Add System',
    updateLabel: 'Edit System',
    searchPlaceholder: 'Search by name',
    searchKeys: ['name', 'normalizedName'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateSystemInputSchema,
    updateSchema: attribute.UpdateSystemInputSchema,
    fieldOverrides: {
      name: { label: 'Name', placeholder: 'System name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  tag: {
    key: 'tag',
    label: 'Tags',
    createLabel: 'Add Tag',
    updateLabel: 'Edit Tag',
    searchPlaceholder: 'Search by name',
    searchKeys: ['name', 'normalizedName'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateTagInputSchema,
    updateSchema: attribute.UpdateTagInputSchema,
    fieldOverrides: {
      name: { label: 'Name', placeholder: 'Tag name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  uom: {
    key: 'uom',
    label: 'UOMs',
    createLabel: 'Add UOM',
    updateLabel: 'Edit UOM',
    searchPlaceholder: 'Search by symbol or name',
    searchKeys: ['name', 'normalizedName', 'symbol'],
    columns: [
      { key: 'symbol', label: 'Symbol' },
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateUomInputSchema,
    updateSchema: attribute.UpdateUomInputSchema,
    fieldOverrides: {
      symbol: { label: 'Symbol', placeholder: 'kg' },
      name: { label: 'Name', placeholder: 'Unit of measure name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      symbol: toStringValue(values.symbol),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      symbol: toStringValue(values.symbol),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
  vendor: {
    key: 'vendor',
    label: 'Vendors',
    createLabel: 'Add Vendor',
    updateLabel: 'Edit Vendor',
    searchPlaceholder: 'Search by SKU or name',
    searchKeys: ['skuCode', 'name', 'normalizedName'],
    columns: [
      { key: 'skuCode', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
    ],
    createSchema: attribute.CreateVendorInputSchema,
    updateSchema: attribute.UpdateVendorInputSchema,
    fieldOverrides: {
      skuCode: { label: 'SKU', placeholder: 'ABC' },
      name: { label: 'Name', placeholder: 'Vendor name' },
      sortOrder: { label: 'Sort Order', type: 'number', step: '0.01' },
    },
    createPayload: (values) => ({
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
    updatePayload: (id, values) => ({
      id,
      skuCode: toStringValue(values.skuCode),
      name: toStringValue(values.name),
      normalizedName: normalizeName(values.name),
      sortOrder: toNumberValue(values.sortOrder),
    }),
  },
};
