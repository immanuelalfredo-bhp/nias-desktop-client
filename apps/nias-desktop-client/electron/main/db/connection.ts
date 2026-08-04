import Database from 'better-sqlite3-multiple-ciphers';

export function openEncryptedDatabase(dbPath: string, key: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma(`key = '${key}'`);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function openUnencryptedDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}