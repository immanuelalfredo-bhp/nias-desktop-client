import Database from 'better-sqlite3-multiple-ciphers';
import { attribute } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class ModeQueries {
  constructor(private readonly db: Database.Database) {}

  listModes(): attribute.Mode[] {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sort_order AS sortOrder,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM modes m
			WHERE m.deleted_at IS NULL
		`);
    logger.debug({ scope: 'ModeQueries' }, 'listModes: SQL query executed successfully.');
    return stmt.all() as attribute.Mode[];
  }

  listDeletedModes(): attribute.Mode[] {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sort_order AS sortOrder,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM modes m
			WHERE m.deleted_at IS NOT NULL
		`);
    logger.debug({ scope: 'ModeQueries' }, 'listDeletedModes: SQL query executed successfully.');
    return stmt.all() as attribute.Mode[];
  }

  getModeById(params: attribute.ModeId): attribute.Mode | null {
    const stmt = this.db.prepare(`
			SELECT
				id,
				name,
				normalized_name AS normalizedName,
				sort_order AS sortOrder,
				created_at AS createdAt,
				updated_at AS updatedAt,
				deleted_at AS deletedAt,
				is_synced AS isSynced,
				sync_version AS syncVersion
			FROM modes m
			WHERE m.id = ?
		`);
    const mode = stmt.get(params.id) as attribute.Mode | undefined;
    return mode || null;
  }

  createMode(params: attribute.CreateMode): void {
    const stmt = this.db.prepare(`
			INSERT INTO modes (
				id,
				name,
				normalized_name,
				sort_order,
				created_at,
				updated_at
			) VALUES (
				@id,
				@name,
				@normalizedName,
				@sortOrder,
				@createdAt,
				@updatedAt
			)
		`);
    stmt.run({
      id: params.id,
      name: params.name,
      normalizedName: params.normalizedName,
      sortOrder: params.sortOrder,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
    logger.debug({ scope: 'ModeQueries' }, 'createMode: SQL query executed successfully.');
  }

  updateMode(params: attribute.UpdateMode): void {
    const modeData = this.getModeById({ id: params.id! });
    if (!modeData) {
      throw new Error(`Mode with ID ${params.id} not found.`);
    }
    const stmt = this.db.prepare(`
			UPDATE modes
			SET
				name = @name,
				normalized_name = @normalizedName,
				sort_order = @sortOrder,
				updated_at = @updatedAt
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
      name: params.name ?? modeData.name,
      normalizedName: params.normalizedName ?? modeData.normalizedName,
      sortOrder: params.sortOrder ?? modeData.sortOrder,
      updatedAt: params.updatedAt ?? modeData.updatedAt,
    });
    logger.debug({ scope: 'ModeQueries' }, 'updateMode: SQL query executed successfully.');
  }

  deleteMode(params: attribute.ModeId): void {
    const stmt = this.db.prepare(`
			UPDATE modes
			SET deleted_at = @deletedAt
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
      deletedAt: new Date().toISOString(),
    });
    logger.debug({ scope: 'ModeQueries' }, 'deleteMode: SQL query executed successfully.');
  }

  restoreMode(params: attribute.ModeId): void {
    const stmt = this.db.prepare(`
			UPDATE modes
			SET deleted_at = NULL
			WHERE id = @id
		`);
    stmt.run({
      id: params.id,
    });
    logger.debug({ scope: 'ModeQueries' }, 'restoreMode: SQL query executed successfully.');
  }
}
