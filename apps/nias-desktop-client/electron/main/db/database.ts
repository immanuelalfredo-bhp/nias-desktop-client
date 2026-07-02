import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app, safeStorage } from 'electron';
import {
  AuthQueries,
} from '../db/auth.js';

export class AuthDatabase {
  private readonly db: Database.Database;
  readonly main: AuthQueries;

  constructor(dbPath: string, key: string) {
    this.db = new Database(dbPath);
    this.db.pragma(`key = '${key}'`);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.main = new AuthQueries(this.db);
  }
}

const KEY_FILE = path.join(app.getPath('userData'), 'key.bin');
const AUTH_DB_PATH = path.join(app.getPath('userData'), 'auth.db');

export function initializeAuthDatabase(): AuthDatabase {
  let key = getOrGenerateEncryptionKey();
  let db: Database.Database;

  try {
    const dbExists = fs.existsSync(AUTH_DB_PATH);
    db = new Database(AUTH_DB_PATH);

    if (dbExists) {
      db.pragma(`key = '${key}'`);
      db.prepare('SELECT count(*) FROM sqlite_master').get();
      ensureAuthDbSchema(db);
    } else {
      setupNewAuthDb(db, key);
    }
  } catch (error) {
    console.error('Key incorrect or DB corrupted, backing up auth data...', error);
    backupAuthArtifacts();

    key = rotateEncryptionKey();
    db = new Database(AUTH_DB_PATH);
    setupNewAuthDb(db, key);
  }

  return new AuthDatabase(AUTH_DB_PATH, key);
}

function setupNewAuthDb(db: Database.Database, key: string) {
  db.pragma(`rekey = '${key}'`);
  db.pragma('journal_mode = WAL');

  ensureAuthDbSchema(db);
}

function ensureAuthDbSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      sync_version INTEGER NOT NULL
    );
  `);
}

function backupAuthArtifacts(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (fs.existsSync(AUTH_DB_PATH)) {
    fs.renameSync(AUTH_DB_PATH, `${AUTH_DB_PATH}.${timestamp}.bak`);
  }

  if (fs.existsSync(KEY_FILE)) {
    fs.renameSync(KEY_FILE, `${KEY_FILE}.${timestamp}.bak`);
  }
}

function getOrGenerateEncryptionKey(): string {
  if (fs.existsSync(KEY_FILE)) {
    const encryptedKey = fs.readFileSync(KEY_FILE);
    return safeStorage.decryptString(encryptedKey);
  }
  return rotateEncryptionKey();
}

function rotateEncryptionKey(): string {
  const newKey = crypto.randomBytes(32).toString('hex');
  const encryptedKey = safeStorage.encryptString(newKey);
  fs.writeFileSync(KEY_FILE, encryptedKey);
  return newKey;
}

// Skeleton for per-user DBs (to be initialized upon login)
export function initializeUserDatabase(uuid: string): Database.Database {
  const userDbPath = path.join(app.getPath('userData'), `${uuid}.db`);
  const db = new Database(userDbPath);
  // db.pragma(`rekey = '${key}'`); // Use same or different logic here
  // Add skeleton tables
  return db;
}