import { attribute } from '@nias/shared';
import { UserDatabase } from '../db/database';
import { createAuditLog, registerGenericIpcHandlers } from '../utils';

export function registerAttributeIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerBrandIpcHandlers(userDb, userId);
  registerModeIpcHandlers(userDb, userId);
  registerUomIpcHandlers(userDb, userId);
  registerDimensionIpcHandlers(userDb, userId);
  registerDimensionValueIpcHandlers(userDb, userId);
  registerSystemIpcHandlers(userDb, userId);
  registerCategoryIpcHandlers(userDb, userId);
  registerVendorIpcHandlers(userDb, userId);
  registerTagIpcHandlers(userDb, userId);
}

export function registerBrandIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'brand',
    userDb.brand,
    {
      create: attribute.CreateBrandSchema,
      update: attribute.UpdateBrandSchema,
      id: attribute.BrandIdSchema,
    },
    (id: string) => {
      const brand = userDb.brand.getById(id);
      return brand ? brand.name : 'Unknown Brand';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'brands', recordId: id, details });
    },
  );
}

export function registerModeIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'mode',
    userDb.mode,
    {
      create: attribute.CreateModeSchema,
      update: attribute.UpdateModeSchema,
      id: attribute.ModeIdSchema,
    },
    (id: string) => {
      const mode = userDb.mode.getById(id);
      return mode ? mode.name : 'Unknown Mode';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'modes', recordId: id, details });
    },
  );
}

export function registerUomIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'uom',
    userDb.uom,
    {
      create: attribute.CreateUomSchema,
      update: attribute.UpdateUomSchema,
      id: attribute.UomIdSchema,
    },
    (id: string) => {
      const uom = userDb.uom.getById(id);
      return uom ? uom.name : 'Unknown UOM';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'uoms', recordId: id, details });
    },
  );
}

export function registerDimensionIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'dimension',
    userDb.dimension,
    {
      create: attribute.CreateDimensionSchema,
      update: attribute.UpdateDimensionSchema,
      id: attribute.DimensionIdSchema,
    },
    (id: string) => {
      const dimension = userDb.dimension.getById(id);
      return dimension ? dimension.name : 'Unknown Dimension';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'dimensions', recordId: id, details });
    },
  );
}

export function registerDimensionValueIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'dimensionValue',
    userDb.dimensionValue,
    {
      create: attribute.CreateDimensionValueSchema,
      update: attribute.UpdateDimensionValueSchema,
      id: attribute.DimensionValueIdSchema,
    },
    (id: string) => {
      const dimensionValue = userDb.dimensionValue.getById(id);
      return dimensionValue ? dimensionValue.name : 'Unknown Dimension Value';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'dimension_values', recordId: id, details });
    },
  );
}

export function registerSystemIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'system',
    userDb.system,
    {
      create: attribute.CreateSystemSchema,
      update: attribute.UpdateSystemSchema,
      id: attribute.SystemIdSchema,
    },
    (id: string) => {
      const system = userDb.system.getById(id);
      return system ? system.name : 'Unknown System';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'systems', recordId: id, details });
    },
  );
}

export function registerCategoryIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'category',
    userDb.category,
    {
      create: attribute.CreateCategorySchema,
      update: attribute.UpdateCategorySchema,
      id: attribute.CategoryIdSchema,
    },
    (id: string) => {
      const category = userDb.category.getById(id);
      return category ? category.name : 'Unknown Category';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'categories', recordId: id, details });
    },
  );
}

export function registerVendorIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'vendor',
    userDb.vendor,
    {
      create: attribute.CreateVendorSchema,
      update: attribute.UpdateVendorSchema,
      id: attribute.VendorIdSchema,
    },
    (id: string) => {
      const vendor = userDb.vendor.getById(id);
      return vendor ? vendor.name : 'Unknown Vendor';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'vendors', recordId: id, details });
    },
  );
}

export function registerTagIpcHandlers(userDb: UserDatabase, userId: string): void {
  registerGenericIpcHandlers(
    'tag',
    userDb.tag,
    {
      create: attribute.CreateTagSchema,
      update: attribute.UpdateTagSchema,
      id: attribute.TagIdSchema,
    },
    (id: string) => {
      const tag = userDb.tag.getById(id);
      return tag ? tag.name : 'Unknown Tag';
    },
    () => {
      const user = userDb.user.getById(userId);
      return user ? user.displayName : 'Unknown User';
    },
    (action: string, id: string, details: string) => {
      createAuditLog(userDb, userId, { action, tableName: 'tags', recordId: id, details });
    },
  );
}