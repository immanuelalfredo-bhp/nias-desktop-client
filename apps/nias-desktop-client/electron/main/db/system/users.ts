import Database from 'better-sqlite3-multiple-ciphers';
import type { User } from '@nias/shared';

export class UserQueries {
  constructor(private readonly db: Database.Database) {}

  listUsers(): User[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        username,
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
      ORDER BY username ASC
    `);
    return stmt.all() as User[];
  }

  listDeletedUsers(): User[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        username,
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
      ORDER BY username ASC
    `);
    return stmt.all() as User[];
  }

  findUserById(id: string): User | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        username,
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
    return stmt.get(id) as User | null;
  }

  findUserByUsername(username: string): User | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        username,
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
      WHERE u.username = ?
    `);
    return stmt.get(username) as User | null;
  }

  createUser(params: {
    id: string;
    username: string;
    passwordHash: string;
    displayName: string | null;
    email: string | null;
    isManagedBy: string | null;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        username,
        password_hash AS passwordHash,
        display_name AS displayName,
        email,
        is_managed_by AS isManagedBy,
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      params.id,
      params.username,
      params.passwordHash,
      params.displayName,
      params.email,
      params.isManagedBy
    );
  }

  updateUser(params: {
    id: string;
    username: string;
    passwordHash: string;
    displayName: string | null;
    email: string | null;
    isManagedBy: string | null;
    }): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET
        username = ?,
        password_hash = ?,
        display_name = ?,
        email = ?,
        is_managed_by = ?
      WHERE id = ?
    `);

    stmt.run(
      params.username,
      params.passwordHash,
      params.displayName,
      params.email,
      params.isManagedBy,
      params.id
    );
  }

  deleteUser(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  }

  restoreUser(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
        SET deleted_at = NULL
        WHERE id = ?
    `);
    stmt.run(id);
  }

  hardDeleteUser(id: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM users
      WHERE id = ?
    `);
    stmt.run(id);
  }
}
