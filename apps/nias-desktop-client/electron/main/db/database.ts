import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app, safeStorage } from 'electron';
import { logger } from '@nias/shared/server';
import { AuthQueries } from './auth.js';
import { SyncQueries } from './sync.js';
import { UserQueries } from './system/users.js';
import { BrandQueries } from './attributes/brands.js';
import { AuditQueries } from './system/audit.js';
import { ModeQueries } from './attributes/modes.js';

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
  readonly audit: AuditQueries;
  readonly brand: BrandQueries;
  readonly mode: ModeQueries;
  readonly sync: SyncQueries;
  readonly user: UserQueries;

  constructor(dbPath: string, key: string) {
    this.db = new Database(dbPath);
    this.db.pragma(`key = '${key}'`);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.audit = new AuditQueries(this.db);
    this.brand = new BrandQueries(this.db);
    this.mode = new ModeQueries(this.db);
    this.sync = new SyncQueries(this.db);
    this.user = new UserQueries(this.db);
  }
}

interface KeyRing {
  system: { auth: string };
  users: { [uuid: string]: string };
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
      logger.info({ scope: 'auth' }, 'Auth database initialized successfully.');
    } else {
      setupNewDb('auth', db, key);
      logger.info({ scope: 'auth' }, 'Auth database created and initialized successfully.');
    }
  } catch (error) {
    logger.error(
      { scope: 'auth', error },
      'Key incorrect or auth DB corrupted, backing up auth data...',
    );
    backupArtifacts('auth');

    key = getOrGenerateKey('system');
    db = new Database(authDbPath);
    setupNewDb('auth', db, key);
    logger.info({ scope: 'auth' }, 'Auth database re-initialized successfully after backup.');
  }

  return new AuthDatabase(authDbPath, key);
}

export function initializeUserDatabase(uuid: string): UserDatabase {
  const userDbPath = path.join(app.getPath('userData'), 'users', `${uuid}.db`);

  if (!fs.existsSync(path.dirname(userDbPath))) {
    fs.mkdirSync(path.dirname(userDbPath), { recursive: true });
    logger.info(
      { scope: 'user', uuid },
      `Created directory for user database at ${path.dirname(userDbPath)}`,
    );
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
      logger.info(
        { scope: 'user', uuid },
        `User database for UUID ${uuid} initialized successfully.`,
      );
    } else {
      setupNewDb('user', db, key);
      logger.info(
        { scope: 'user', uuid },
        `User database for UUID ${uuid} created and initialized successfully.`,
      );
    }
  } catch (error) {
    logger.error(
      { scope: 'user', uuid, error },
      `Key incorrect or user DB corrupted for UUID ${uuid}, backing up user data...`,
    );
    backupArtifacts('user', uuid);

    key = getOrGenerateKey('user', uuid);
    db = new Database(userDbPath);
    runMigrations(db);
    logger.info(
      { scope: 'user', uuid },
      `User database for UUID ${uuid} re-initialized successfully after backup.`,
    );
  }

  return new UserDatabase(userDbPath, key);
}

function loadKeyRing(): KeyRing {
  if (!fs.existsSync(keyRingFile)) {
    logger.warn({ scope: 'keyring' }, 'Key ring file does not exist. Creating a new one.');
    return { system: { auth: '' }, users: {} };
  }
  logger.info({ scope: 'keyring' }, 'Key ring file loaded successfully.');
  return JSON.parse(fs.readFileSync(keyRingFile, 'utf-8')) as KeyRing;
}

function saveKeyRing(keyRing: KeyRing): void {
  fs.writeFileSync(keyRingFile, JSON.stringify(keyRing, null, 2), 'utf-8');
  logger.info({ scope: 'keyring' }, 'Key ring file saved successfully.');
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
      logger.info({ scope: 'keyring' }, 'No system auth key found. Generating a new one.');
      const rawKey = crypto.randomBytes(32).toString('hex');
      const encryptedKey = safeStorage.encryptString(rawKey);
      keyRing.system.auth = Buffer.from(encryptedKey).toString('base64');
      saveKeyRing(keyRing);
      logger.info({ scope: 'keyring' }, 'Generated and stored new system auth key.');
      return rawKey;
    }
    const encryptedKeyBuffer = Buffer.from(keyRing.system.auth, 'base64');
    const decryptedKey = safeStorage.decryptString(encryptedKeyBuffer);
    return decryptedKey;
  } else if (type === 'user' && uuid) {
    if (!keyRing.users[uuid]) {
      logger.info(
        { scope: 'keyring', uuid },
        `No user auth key found for UUID ${uuid}. Generating a new one.`,
      );
      const rawKey = crypto.randomBytes(32).toString('hex');
      const encryptedKey = safeStorage.encryptString(rawKey);
      keyRing.users[uuid] = Buffer.from(encryptedKey).toString('base64');
      saveKeyRing(keyRing);
      logger.info(
        { scope: 'keyring', uuid },
        `Generated and stored new user auth key for UUID ${uuid}.`,
      );
      return rawKey;
    }
    const encryptedKeyBuffer = Buffer.from(keyRing.users[uuid], 'base64');
    const decryptedKey = safeStorage.decryptString(encryptedKeyBuffer);
    logger.info({ scope: 'keyring', uuid }, `Retrieved existing user auth key for UUID ${uuid}.`);
    return decryptedKey;
  }
  logger.error(
    { scope: 'keyring', uuid, error: 'Invalid type or missing UUID for key retrieval' },
    `Invalid type or missing UUID for key retrieval: type=${type}, uuid=${uuid}`,
  );
  throw new Error(`Invalid type or missing UUID for key retrieval: type=${type}, uuid=${uuid}`);
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
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      jwt_token TEXT,
      jwt_token_expiration INTEGER,
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
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const alreadyRun = db.prepare('SELECT 1 FROM schema_migrations WHERE filename = ?').get(file);
      if (!alreadyRun) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        const transaction = db.transaction(() => {
          db.exec(sql);
          db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
        });
        transaction();
        logger.info({ scope: 'migrations', file }, `Migration ${file} applied successfully.`);
      }
    }
  } else {
    logger.warn(
      { scope: 'migrations' },
      `Migrations directory does not exist at ${migrationsDir}. No migrations applied.`,
    );
  }
}

function backupArtifacts(type: 'auth' | 'user', uuid?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (type === 'auth' && fs.existsSync(authDbPath)) {
    fs.renameSync(authDbPath, `${authDbPath}.${timestamp}.bak`);
    logger.info(
      { scope: 'auth', path: authDbPath },
      `Auth database backed up successfully: ${authDbPath}.${timestamp}.bak`,
    );
  } else if (type === 'user' && uuid) {
    const userDbPath = path.join(app.getPath('userData'), 'users', `${uuid}.db`);
    if (fs.existsSync(userDbPath)) {
      fs.renameSync(userDbPath, `${userDbPath}.${timestamp}.bak`);
      logger.info(
        { scope: 'user', path: userDbPath, uuid },
        `User database backed up successfully for UUID ${uuid}: ${userDbPath}.${timestamp}.bak`,
      );
    }
  }

  if (fs.existsSync(keyRingFile)) {
    fs.renameSync(keyRingFile, `${keyRingFile}.${timestamp}.bak`);
    logger.info(
      { scope: 'keyring', path: keyRingFile },
      `Key ring backed up successfully: ${keyRingFile}.${timestamp}.bak`,
    );
  }
}
