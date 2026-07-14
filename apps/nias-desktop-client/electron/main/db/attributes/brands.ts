import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class BrandQueries {
  constructor(private readonly db: Database.Database) {}

  listBrands(): attribute.Brand[] {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sku_code AS skuCode,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM brands b
			WHERE b.deleted_at IS NULL
		`);
    logger.debug({ scope: 'BrandQueries' }, 'listBrands: SQL query executed successfully.');
    return stmt.all() as attribute.Brand[];
  }

  listDeletedBrands(): attribute.Brand[] {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sku_code AS skuCode,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM brands b
			WHERE b.deleted_at IS NOT NULL
		`);
    logger.debug({ scope: 'BrandQueries' }, 'listDeletedBrands: SQL query executed successfully.');
    return stmt.all() as attribute.Brand[];
  }

  getBrandById(params: attribute.BrandId): attribute.Brand | null {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sku_code AS skuCode,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM brands b
			WHERE b.id = ?
		`);
    const brand = stmt.get(params.id) as attribute.Brand | undefined;
    return brand || null;
  }

  createBrand(params: attribute.CreateBrand): void {
    const stmt = this.db.prepare(`
			INSERT INTO brands (
				id,
				name,
				normalized_name,
				sku_code,
				created_at,
				updated_at
			) VALUES (
				@id,
				@name,
				@normalizedName,
				@skuCode,
				@createdAt,
				@updatedAt
			)
		`);
    stmt.run({
      id: params.id,
      name: params.name,
      normalizedName: params.normalizedName,
      skuCode: params.skuCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.debug({ scope: 'BrandQueries' }, 'createBrand: SQL query executed successfully.');
  }

  updateBrand(params: attribute.UpdateBrand): void {
    const brandData = this.getBrandById({ id: params.id! });
    if (!brandData) {
      throw new Error(`Brand with ID ${params.id} not found.`);
    }

    const stmt = this.db.prepare(`
			UPDATE brands
			SET
				name = @name,
				normalized_name = @normalizedName,
				sku_code = @skuCode,
				updated_at = @updatedAt
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
      name: params.name ?? brandData.name,
      normalizedName: params.normalizedName ?? brandData.normalizedName,
      skuCode: params.skuCode ?? brandData.skuCode,
      updatedAt: new Date().toISOString(),
    });
    logger.debug({ scope: 'BrandQueries' }, 'updateBrand: SQL query executed successfully.');
  }

  deleteBrand(params: attribute.BrandId): void {
    const stmt = this.db.prepare(`
			UPDATE brands
			SET deleted_at = @deletedAt
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
      deletedAt: new Date().toISOString(),
    });
    logger.debug({ scope: 'BrandQueries' }, 'deleteBrand: SQL query executed successfully.');
  }

  restoreBrand(params: attribute.BrandId): void {
    const stmt = this.db.prepare(`
			UPDATE brands
			SET deleted_at = NULL
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
    });
    logger.debug({ scope: 'BrandQueries' }, 'restoreBrand: SQL query executed successfully.');
  }

  syncBrand(params: attribute.Brand): void {
    const stmt = this.db.prepare(`
			INSERT INTO brands (
				id,
				name,
				normalized_name,
				sku_code,
				created_at,
				updated_at,
				deleted_at,
				is_synced,
				sync_version
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				normalized_name = excluded.normalized_name,
				sku_code = excluded.sku_code,
				created_at = excluded.created_at,
				updated_at = excluded.updated_at,
				deleted_at = excluded.deleted_at,
				is_synced = excluded.is_synced,
				sync_version = excluded.sync_version
		`);

    stmt.run(
      params.id,
      params.name,
      params.normalizedName,
      params.skuCode,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
      params.isSynced ? 1 : 0,
      params.syncVersion,
    );
    logger.debug(
      { scope: 'BrandQueries', brandId: params.id },
      `syncBrand: SQL query executed successfully for id: ${params.id}.`,
    );
  }
}
