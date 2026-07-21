import Database from 'better-sqlite3-multiple-ciphers';
import { local } from '@nias/shared';

export class LocalQueries {
  constructor(private readonly db: Database.Database) {}

  count(): number {
    const result = this.db.prepare('SELECT COUNT(*) AS count FROM users').get() as {
      count: number;
    };
    return result.count;
  }

  getById(id: string): local.User | null {
    const result = this.db
      .prepare(
        `SELECT
          id, email, password_hash AS passwordHash, access_token AS accessToken,
          refresh_token AS refreshToken, expires_at AS expiresAt, sync_version AS syncVersion
        FROM users WHERE id = ?
      `,
      )
      .get(id) as local.User | undefined;

    return result || null;
  }

  getByEmail(email: string): local.User | null {
    const result = this.db
      .prepare(
        `SELECT
          id, email, password_hash AS passwordHash, access_token AS accessToken,
          refresh_token AS refreshToken, expires_at AS expiresAt, sync_version AS syncVersion
        FROM users WHERE email = ?
      `,
      )
      .get(email) as local.User | undefined;

    return result || null;
  }

  upsert(params: local.UserData): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, email, password_hash, sync_version
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        sync_version = excluded.sync_version
    `);
    stmt.run(params.id, params.email, params.passwordHash, params.syncVersion);
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  getSyncVersion(): local.UserSync[] {
    const result = this.db
      .prepare('SELECT id, sync_version AS syncVersion FROM users')
      .all() as local.UserSync[];
    return result;
  }

  updatePasswordHash(id: string, passwordHash: string, syncVersion: number): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET password_hash = ?, sync_version = ?
      WHERE id = ?
    `);
    stmt.run(passwordHash, syncVersion, id);
  }

  updateTokens(id: string, accessToken: string, refreshToken: string, expiresAt: string): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET access_token = ?, refresh_token = ?, expires_at = ?
      WHERE id = ?
    `);
    stmt.run(accessToken, refreshToken, expiresAt, id);
  }

  transaction(callback: () => void): void {
    const transaction = this.db.transaction(callback);
    transaction();
  }
}
