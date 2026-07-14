import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { logger } from '@nias/shared/server';
import { AuthQueries } from './auth.js';
import { SyncQueries } from './sync.js';
import { UserQueries } from './system/users.js';
import { BrandQueries } from './attributes/brands.js';
import { AuditQueries } from './system/audit.js';
import { ModeQueries } from './attributes/modes.js';
import { UomQueries } from './attributes/uoms.js';
import { DimensionQueries } from './attributes/dimensions.js';
import { DimensionValuesQueries } from './attributes/dimension-values.js';
import { SystemQueries } from './attributes/systems.js';
import { CategoryQueries } from './attributes/categories.js';
import { VendorQueries } from './attributes/vendors.js';
import { TagQueries } from './attributes/tags.js';
import { openEncryptedDatabase } from './connection.js';
import { backupArtifacts, ensureAuthDbSchema, runMigrations, setupNewDb } from './migrations.js';
import { getOrGenerateKey } from './keyring.js';

export class AuthDatabase {
  private readonly db: Database.Database;
  readonly main: AuthQueries;

  constructor(dbPath: string, key: string) {
    this.db = openEncryptedDatabase(dbPath, key);
    this.main = new AuthQueries(this.db);
  }
}

export class UserDatabase {
  private readonly db: Database.Database;

  // Attribute queries
  readonly brand: BrandQueries;
  readonly mode: ModeQueries;
  readonly uom: UomQueries;
  readonly dimension: DimensionQueries;
  readonly dimensionValue: DimensionValuesQueries;
  readonly system: SystemQueries;
  readonly category: CategoryQueries;
  readonly vendor: VendorQueries;
  readonly tag: TagQueries;

  // System queries
  readonly audit: AuditQueries;
  readonly user: UserQueries;

  // Sync queries
  readonly sync: SyncQueries;

  constructor(dbPath: string, key: string) {
    this.db = openEncryptedDatabase(dbPath, key);

    // Attribute queries
    this.brand = new BrandQueries(this.db);
    this.mode = new ModeQueries(this.db);
    this.uom = new UomQueries(this.db);
    this.dimension = new DimensionQueries(this.db);
    this.dimensionValue = new DimensionValuesQueries(this.db);
    this.system = new SystemQueries(this.db);
    this.category = new CategoryQueries(this.db);
    this.vendor = new VendorQueries(this.db);
    this.tag = new TagQueries(this.db);

    // System queries
    this.audit = new AuditQueries(this.db);
    this.user = new UserQueries(this.db);

    // Sync queries
    this.sync = new SyncQueries(this.db);
  }
}
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
    backupArtifacts('auth', authDbPath);

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
    backupArtifacts('user', authDbPath, uuid);

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
