import Database from 'better-sqlite3-multiple-ciphers';
import { auth, logger } from '@nias/shared';

export class AuthQueries {
  constructor(private readonly db: Database.Database) {}

  countLocalUsers(): number {
    const result = this.db.prepare('SELECT COUNT(*) AS count FROM users').get() as {
      count: number;
    };

    logger.info({ scope: 'auth', count: result.count }, 'Counted local users');
    return result.count;
  }

  listLocalUserSyncStates(): auth.LoginSyncState[] {
    const result = this.db
      .prepare(
        `
      SELECT id, sync_version AS syncVersion FROM users
    `,
      )
      .all() as auth.LoginSyncState[];

    logger.info({ scope: 'auth', count: result.length }, 'Listed local user sync states');
    return result;
  }

  getLocalUser(email: string): auth.LocalUser | null {
    const result = this.db
      .prepare(
        `SELECT
          id,
          email,
          password_hash AS passwordHash,
          jwt_token AS jwtToken,
          jwt_token_expiration AS jwtTokenExpiration,
          sync_version AS syncVersion
        FROM users WHERE email = ?
      `,
      )
      .get(email) as auth.LocalUser | undefined;

    logger.info({ scope: 'auth', email, found: !!result }, 'Fetched local user by email');
    return result || null;
  }

  upsertLocalUser(params: auth.LocalUser): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id,
        email,
        password_hash,
        jwt_token,
        jwt_token_expiration,
        sync_version
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        jwt_token = excluded.jwt_token,
        jwt_token_expiration = excluded.jwt_token_expiration,
        sync_version = excluded.sync_version
    `);
    stmt.run(
      params.id,
      params.email,
      params.passwordHash,
      params.jwtToken,
      params.jwtTokenExpiration,
      params.syncVersion,
    );
    logger.info({ scope: 'auth', userId: params.id }, 'Upserted local user');
  }

  deleteLocalUser(id: string): void {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    logger.info({ scope: 'auth', userId: id }, 'Deleted local user');
  }

  runInTransaction(callback: () => void): void {
    const transaction = this.db.transaction(callback);
    transaction();
  }
}
