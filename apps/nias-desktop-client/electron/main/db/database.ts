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

export class UserDatabase {
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

interface KeyRing {
  system: { auth: string };
  users: { [uuid: string]: string; }
}

const keyRingFile = path.join(app.getPath('userData'), 'keys.json');
const authDbPath = path.join(app.getPath('userData'), 'auth.db');

export function initializeAuthDatabase(): AuthDatabase {
  
  let key = getOrGenerateKey('system');
  let db: Database.Database;

  try {
    const dbExists = fs.existsSync(authDbPath);
    db = new Database(authDbPath);

    if (dbExists) {
      db.pragma(`key = '${key}'`);
      db.prepare('SELECT count(*) FROM sqlite_master').get();
      ensureAuthDbSchema(db);
    } else {
      setupNewDb('auth', db, key);
    }
  } catch (error) {
    console.error('Key incorrect or DB corrupted, backing up auth data...', error);
    backupArtifacts('auth');

    key = getOrGenerateKey('system');
    db = new Database(authDbPath);
    setupNewDb('auth', db, key);
  }

  return new AuthDatabase(authDbPath, key);
}

export function initializeUserDatabase(uuid: string): UserDatabase {

  const userDbPath = path.join(app.getPath('userData'), 'users', `${uuid}.db`);
  
  if (!fs.existsSync(path.dirname(userDbPath))) {
    fs.mkdirSync(path.dirname(userDbPath), { recursive: true });
  }
  
  let key = getOrGenerateKey('user', uuid);
  let db: Database.Database;
  
  try {
    const dbExists = fs.existsSync(userDbPath);
    db = new Database(userDbPath);

    if (dbExists) {
      db.pragma(`key = '${key}'`);
      db.prepare('SELECT count(*) FROM sqlite_master').get();
      runMigrations(db);
    } else {
      setupNewDb('user', db, key);
    }
  } catch (error) {
    console.error('Key incorrect or user DB corrupted, backing up user data...', error);
    backupArtifacts('user', uuid);

    key = getOrGenerateKey('user', uuid);
    db = new Database(userDbPath);
    runMigrations(db);
  }
  
  return new UserDatabase(userDbPath, key);
}

function loadKeyRing(): KeyRing {
  if (!fs.existsSync(keyRingFile)) {
    return { system: { auth: '' }, users: {} };
  }
  return JSON.parse(fs.readFileSync(keyRingFile, 'utf-8')) as KeyRing;
}

function saveKeyRing(keyRing: KeyRing): void {
  fs.writeFileSync(keyRingFile, JSON.stringify(keyRing, null, 2), 'utf-8');
  if (process.platform === 'win32') {
    // On Windows, ensure the file is not read-only
    fs.chmodSync(keyRingFile, 0o600);
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    // On macOS and Linux, ensure the file is not world-readable
    fs.chmodSync(keyRingFile, 0o600);
  }
}

function getOrGenerateKey(type: 'system' | 'user', uuid?: string): string {
  const keyRing = loadKeyRing();

  if (type === 'system') {
    if (!keyRing.system.auth) {
      const rawKey = crypto.randomBytes(32).toString('hex');
      const encryptedKey = safeStorage.encryptString(rawKey);
      keyRing.system.auth = Buffer.from(encryptedKey).toString('base64');
      saveKeyRing(keyRing);
      return rawKey;
    }
    const encryptedKeyBuffer = Buffer.from(keyRing.system.auth, 'base64');
    const decryptedKey = safeStorage.decryptString(encryptedKeyBuffer);
    return decryptedKey;
    
  } else if (type === 'user' && uuid) {
    if (!keyRing.users[uuid]) {
      const rawKey = crypto.randomBytes(32).toString('hex');
      const encryptedKey = safeStorage.encryptString(rawKey);
      keyRing.users[uuid] = Buffer.from(encryptedKey).toString('base64');
      saveKeyRing(keyRing);
      return rawKey;
    }
    const encryptedKeyBuffer = Buffer.from(keyRing.users[uuid], 'base64');
    const decryptedKey = safeStorage.decryptString(encryptedKeyBuffer);
    return decryptedKey;
  }
  throw new Error('Invalid key type or missing UUID for user key.');
}

function setupNewDb(type: 'auth' | 'user', db: Database.Database, key: string) {
  db.pragma(`rekey = '${key}'`);
  db.pragma('journal_mode = WAL');

  if (type === 'auth') {
    ensureAuthDbSchema(db);
  } else if (type === 'user') {
    runMigrations(db);
  }
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

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const alreadyRun = db.prepare('SELECT 1 FROM schema_migrations WHERE filename = ?')
                           .get(file);
      if (!alreadyRun) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        const transaction = db.transaction(() => {
          db.exec(sql);
          db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
        });
        transaction();
        console.log(`Applied migration: ${file}`);
      }
    }
  }
}

function backupArtifacts(type: 'auth' | 'user', uuid?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (type === 'auth' && fs.existsSync(authDbPath)) {
    fs.renameSync(authDbPath, `${authDbPath}.${timestamp}.bak`);
  } else if (type === 'user' && uuid) {
  const userDbPath = path.join(app.getPath('userData'), 'users', `${uuid}.db`);
    if (fs.existsSync(userDbPath)) {
      fs.renameSync(userDbPath, `${userDbPath}.${timestamp}.bak`);
    }
  }

  if (fs.existsSync(keyRingFile)) {
    fs.renameSync(keyRingFile, `${keyRingFile}.${timestamp}.bak`);
  }
}