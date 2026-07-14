import Database from 'better-sqlite3-multiple-ciphers';
import { type system } from '@nias/shared';
import { logger } from '@nias/shared/server';
import { BaseQueries } from '../../utils.js';

const COLUMNS = `
  id,
  display_name AS displayName,
  email,
  password_hash AS passwordHash,
  is_managed_by AS isManagedBy,
  created_at AS createdAt,
  updated_at AS updatedAt,
  deleted_at AS deletedAt,
  is_synced AS isSynced,
  sync_version AS syncVersion`;

export class UserQueries extends BaseQueries<system.User, system.User, system.UpdateUser> {
  constructor(db: Database.Database) {
    super(db, 'users', COLUMNS);
  }

  listUsers(): system.User[] {
    logger.debug({ scope: 'UserQueries' }, 'listUsers: SQL query executed successfully.');
    return this.listActive();
  }

  listDeletedUsers(): system.User[] {
    logger.debug({ scope: 'UserQueries' }, 'listDeletedUsers: SQL query executed successfully.');
    return this.listDeleted();
  }

  getUserById(id: string): system.User | null {
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `getUserById: SQL query executed successfully for id: ${id}.`,
    );
    return this.getById(id);
  }

  create(params: system.User): void {
    this.db.prepare(`
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
      `).run(
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
      `create: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  update(params: system.UpdateUser): void {
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
      `update: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  createUser(params: system.User): void {
    this.create(params);
  }

  updateUser(params: system.UpdateUser): void {
    this.update(params);
  }

  deleteUser(id: string): void {
    this.delete(id);
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `deleteUser: SQL query executed successfully for id: ${id}.`,
    );
  }

  restoreUser(id: string): void {
    this.restore(id);
    logger.debug(
      { scope: 'UserQueries', userId: id },
      `restoreUser: SQL query executed successfully for id: ${id}.`,
    );
  }

  upsertSynced(params: system.User): void {
    this.db.prepare(`
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
      `).run(
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
      `upsertSynced: SQL query executed successfully for id: ${params.id}.`,
    );
  }

  syncUsers(params: system.User): void {
    this.upsertSynced(params);
  }
}
