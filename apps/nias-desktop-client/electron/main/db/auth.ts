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
    displayName?: string | null, 
    email?: string | null
  }): void {
    
    const tx = this.db.transaction(() => {
      const stmt1 = this.db.prepare(`
        INSERT INTO users (id, username, passwordHash, displayName, email)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt1.run(
        params.adminId, 
        params.username, 
        params.passwordHash, 
        params.displayName, 
        params.email
      );
      const stmt2 = this.db.prepare(`UPDATE sync SET sync_version = 1`);
      stmt2.run();
    });

    tx();
  }
}