import Database from 'better-sqlite3-multiple-ciphers';
import type { UserSyncState } from '@nias/shared';

interface LocalUser {
  id: string;
  username: string;
  password_hash: string;
}

export class AuthQueries {
  constructor(private readonly db: Database.Database) {}

  countLocalUsers(): number {
    const result = this.db
      .prepare('SELECT COUNT(*) AS count FROM users')
      .get() as { count: number };

    return result.count;
  }

  listLocalUserSyncStates(): UserSyncState[] {
    const result = this.db.prepare(`
      SELECT id, sync_version AS syncVersion FROM users
    `).all() as UserSyncState[];

    return result;
  }

  insertBootstrapUser(params: {
    adminId: string;
    username: string;
    passwordHash: string;
    syncVersion: number;
  }): void {
    const tx = this.db.transaction(() => {
      const stmt1 = this.db.prepare(`
        INSERT INTO users (id, username, password_hash, sync_version)
        VALUES (?, ?, ?, ?)
      `);
      stmt1.run(
        params.adminId,
        params.username,
        params.passwordHash,
        params.syncVersion
      );
      const stmt2 = this.db.prepare(`UPDATE sync SET sync_version = ?`);
      stmt2.run(params.syncVersion);
    });

    tx();
  }

  findLocalUser(username: string): LocalUser | null {
    const result = this.db
      .prepare(
        'SELECT id, username, password_hash FROM users WHERE username = ?'
      )
      .get(username) as LocalUser | undefined;

    return result || null;
  }

  upsertLocalUser(params: {
    id: string;
    username: string; 
    passwordHash: string;
    syncVersion: number;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password_hash, sync_version)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        password_hash = excluded.password_hash,
        sync_version = excluded.sync_version
    `);
    stmt.run(params.id, params.username, params.passwordHash, params.syncVersion);
  }

  updateLocalUsers(params: {
    id: string; 
    username: string; 
    passwordHash: string;
    syncVersion: number
  }): void {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET username = ?, password_hash = ?, sync_version = ?
      WHERE id = ?
    `);
    stmt.run(params.username, params.passwordHash, params.syncVersion, params.id);
  }

  deleteLocalUsers(id: string): void {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  getLocalUserIdByUsername(username: string): string | null {
    const result = this.db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(username) as { id: string } | undefined;

    return result ? result.id : null;
  }

  runInTransaction(callback: () => void): void {
    const transaction = this.db.transaction(callback);
    transaction();
  }
}