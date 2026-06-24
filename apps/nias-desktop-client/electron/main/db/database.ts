import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app, safeStorage } from 'electron';
import { UserQueries } from './system/users.js';

const KEY_FILE = path.join(app.getPath('userData'), 'key.bin');
const LOGIN_DB_PATH = path.join(app.getPath('userData'), 'login.db');

export function initializeLoginDatabase(): Database.Database {
  const key = getOrGenerateEncryptionKey();

  const dbExists = fs.existsSync(LOGIN_DB_PATH);
  const db = new Database(LOGIN_DB_PATH);
  if (!dbExists) {
      db.pragma('journal_mode = WAL');
      db.pragma(`rekey = '${key}'`);
      db.prepare('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)').run();
      console.log("Database file created and encrypted.");
  } else {
      db.pragma(`key = '${key}'`);
      db.prepare('SELECT count(*) FROM sqlite_master').get();
  }
  return db;
}

function getOrGenerateEncryptionKey(): string {
  if (fs.existsSync(KEY_FILE)) {
    const encryptedKey = fs.readFileSync(KEY_FILE);
    return safeStorage.decryptString(encryptedKey);
  } else {
    const newKey = crypto.randomBytes(32).toString('hex');
    const encryptedKey = safeStorage.encryptString(newKey);
    fs.writeFileSync(KEY_FILE, encryptedKey);
    return newKey;
  }
}

export class AppDatabase {
  private readonly db: Database.Database;
  readonly users: UserQueries;

  // Change constructor to accept the database instance, not the path
  constructor(db: Database.Database) {
    this.db = db;
    // These pragmas should have already been set, but it's safe to keep them
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.users = new UserQueries(this.db);
  }
}