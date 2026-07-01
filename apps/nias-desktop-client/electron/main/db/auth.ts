import Database from 'better-sqlite3-multiple-ciphers';

export class AuthQueries {
  constructor(private readonly db: Database.Database) {}

  countLocalUsers(): number {
    const result = this.db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    return result.count;
  }

  insertBootstrapUser(params: {
    adminId: string, 
    username: string, 
    passwordHash: string,
    syncVersion: number
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
}