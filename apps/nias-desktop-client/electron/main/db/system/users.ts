import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { logger } from '@nias/shared/server';

export class UserQueries {
  constructor(private readonly db: Database.Database) {}

  listUsers(): system.User[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        password_hash AS passwordHash,
        display_name AS displayName,
        email,
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
        password_hash AS passwordHash,
        display_name AS displayName,
        email,
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

  findUserById(id: string): system.User | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        password_hash AS passwordHash,
        display_name AS displayName,
        email,
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
      `findUserById: SQL query executed successfully for id: ${id}.`,
    );
    return stmt.get(id) as system.User | null;
  }

  findUserByEmail(email: string): system.User | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        password_hash AS passwordHash,
        display_name AS displayName,
        email,
        is_managed_by AS isManagedBy,
        created_at AS createdAt,
        updated_at AS updatedAt,
        deleted_at AS deletedAt,
        is_synced AS isSynced,
        sync_version AS syncVersion
      FROM users u
      WHERE u.email = ?
    `);
    logger.debug(
      { scope: 'UserQueries', email },
      `findUserByEmail: SQL query executed successfully for email: ${email}.`,
    );
    return stmt.get(email) as system.User | null;
  }

  createUser(params: system.CreateUser): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        password_hash,
        display_name,
        email,
        is_managed_by
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      params.id,
      params.passwordHash,
      params.displayName,
      params.email,
      params.isManagedBy ?? null,
    );
    logger.debug(
      { scope: 'UserQueries', userId: params.id },
      `createUser: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  updateUser(params: system.UpdateUser): void {
    const existingUser = this.findUserById(params.id!);

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
        password_hash = ?,
        display_name = ?,
        email = ?,
        is_managed_by = ?
      WHERE id = ?
    `);

    stmt.run(
      params.passwordHash ?? existingUser.passwordHash,
      params.displayName ?? existingUser.displayName,
      params.email ?? existingUser.email,
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
    const conflictingUser = this.db
      .prepare(
        `
      SELECT id FROM users
      WHERE id <> ?
      LIMIT 1
    `,
      )
      .get(params.id) as { id: string } | undefined;

    if (conflictingUser) {
      // Keep server identity authoritative by removing the stale local row that collides on id.
      this.db.prepare(`DELETE FROM users WHERE id = ?`).run(conflictingUser.id);
      logger.warn(
        {
          scope: 'UserQueries',
          userId: params.id,
          conflictingUserId: conflictingUser.id,
        },
        'Removed conflicting local user row before sync upsert',
      );
    }

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        password_hash,
        display_name,
        email,
        is_managed_by,
        created_at,
        updated_at,
        deleted_at,
        is_synced,
        sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
        password_hash = excluded.password_hash,
        display_name = excluded.display_name,
        email = excluded.email,
        is_managed_by = excluded.is_managed_by,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        is_synced = excluded.is_synced,
        sync_version = excluded.sync_version
    `);

    stmt.run(
      params.id,
      params.passwordHash,
      params.displayName,
      params.email,
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
