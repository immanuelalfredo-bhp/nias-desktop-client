import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class UserQueries {
  constructor(private readonly db: Database.Database) {}

  listUsers(): system.User[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        display_name AS displayName,
        email,
        password_hash AS passwordHash,
        is_managed_by AS isManagedBy,
        created_at AS createdAt,
        updated_at AS updatedAt,
        deleted_at AS deletedAt,
        is_synced AS isSynced,
        sync_version AS syncVersion
      FROM users u
      WHERE u.deleted_at IS NULL
    `);
    logger.debug({ scope: 'UserQueries' }, 'listUsers: SQL query executed successfully.');
    return stmt.all() as system.User[];
  }

  listDeletedUsers(): system.User[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        display_name AS displayName,
        email,
        password_hash AS passwordHash,
        is_managed_by AS isManagedBy,
        created_at AS createdAt,
        updated_at AS updatedAt,
        deleted_at AS deletedAt,
        is_synced AS isSynced,
        sync_version AS syncVersion
      FROM users u
      WHERE u.deleted_at IS NOT NULL
    `);
    logger.debug({ scope: 'UserQueries' }, 'listDeletedUsers: SQL query executed successfully.');
    return stmt.all() as system.User[];
  }

  getUserById(id: string): system.User | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        display_name AS displayName,
        email,
        password_hash AS passwordHash,
        is_managed_by AS isManagedBy,
        created_at AS createdAt,
        updated_at AS updatedAt,
        deleted_at AS deletedAt,
        is_synced AS isSynced,
        sync_version AS syncVersion
      FROM users u
      WHERE u.id = ?
    `);
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `getUserById: SQL query executed successfully for id: ${id}.`,
    );
    return stmt.get(id) as system.User | null;
  }

  createUser(params: system.User): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        display_name,
        email,
        password_hash,
        is_managed_by,
        created_at,
        updated_at,
        deleted_at,
        is_synced,
        sync_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      params.id,
      params.displayName,
      params.email,
      params.passwordHash,
      params.isManagedBy ?? null,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
      params.isSynced ? 1 : 0,
      params.syncVersion,
    );
    logger.debug(
      { scope: 'UserQueries', userId: params.id },
      `createUser: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  updateUser(params: system.UpdateUser): void {
    const existingUser = this.getUserById(params.id!);

    // Should not happen, but just in case, we check if the user exists before updating
    if (!existingUser) {
      logger.error(
        { scope: 'UserQueries', userId: params.id },
        `updateUser: User with id ${params.id} not found.`,
      );
      throw new Error(`User with id ${params.id} not found.`);
    }

    const stmt = this.db.prepare(`
      UPDATE users
      SET
        display_name = ?,
        email = ?,
        password_hash = ?,
        is_managed_by = ?
      WHERE id = ?
    `);

    stmt.run(
      params.displayName ?? existingUser.displayName,
      params.email ?? existingUser.email,
      params.passwordHash ?? existingUser.passwordHash,
      params.isManagedBy ?? existingUser.isManagedBy,
      params.id,
    );
    logger.debug(
      { scope: 'UserQueries', userId: params.id },
      `updateUser: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  deleteUser(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `deleteUser: SQL query executed successfully for id: ${id}.`,
    );
  }

  restoreUser(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
        SET deleted_at = NULL
        WHERE id = ?
    `);
    stmt.run(id);
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `restoreUser: SQL query executed successfully for id: ${id}.`,
    );
  }

  syncUsers(params: system.User): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        display_name,
        email,
        password_hash,
        is_managed_by,
        created_at,
        updated_at,
        deleted_at,
        is_synced,
        sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        email = excluded.email,
        password_hash = excluded.password_hash,
        is_managed_by = excluded.is_managed_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        is_synced = excluded.is_synced,
        sync_version = excluded.sync_version
    `);

    stmt.run(
      params.id,
      params.displayName,
      params.email,
      params.passwordHash,
      params.isManagedBy ?? null,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
      params.isSynced ? 1 : 0,
      params.syncVersion,
    );
    logger.debug(
      { scope: 'UserQueries', userId: params.id },
      `syncUser: SQL query executed successfully for id: ${params.id}.`,
    );
  }
}
