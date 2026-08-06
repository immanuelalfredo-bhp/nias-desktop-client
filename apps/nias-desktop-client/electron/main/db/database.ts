import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { logger } from '@nias/shared/server';
import {
  // System queries
  UserQueries,
  AuditQueries,

  // Attribute queries
  BrandQueries,
  ModeQueries,
  UomQueries,
  DimensionQueries,
  DimensionValuesQueries,
  SystemQueries,
  CategoryQueries,
  VendorQueries,
  TagQueries,

  // Item queries
  ItemRecordQueries,
  AliasQueries,
  DimensionMapQueries,
  SystemMapQueries,
  TagMapQueries,
  GenerationRulesQueries,

  // Variant queries
  VariantRecordQueries,
  DimensionValueMapQueries,

  // Order queries
  RequestItemQueries,

  // Other queries
  SyncQueries,
  LocalQueries,
} from './queries/index.js';
import { openEncryptedDatabase } from './connection.js';
import { backupArtifacts, ensureAuthDbSchema, runMigrations, setupNewDb } from './migrations.js';
import { getOrGenerateKey } from './keyring.js';

export class AuthDatabase {
  private readonly db: Database.Database;
  readonly main: LocalQueries;

  constructor(dbPath: string, key: string) {
    this.db = openEncryptedDatabase(dbPath, key);
    this.main = new LocalQueries(this.db);
  }

  close(): void {
    this.db.close();
  }
}

export class UserDatabase {
  private readonly db: Database.Database;

  // System queries
  readonly user: UserQueries;
  readonly audit: AuditQueries;

  // Sync queries
  readonly sync: SyncQueries;

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

  // Item queries
  readonly item: ItemRecordQueries;
  readonly alias: AliasQueries;
  readonly dimensionMap: DimensionMapQueries;
  readonly systemMap: SystemMapQueries;
  readonly tagMap: TagMapQueries;
  readonly generationRules: GenerationRulesQueries;

  // Order queries
  readonly requestItem: RequestItemQueries;

  // Variant queries
  readonly variant: VariantRecordQueries;
  readonly dimensionValueMap: DimensionValueMapQueries;

  constructor(dbPath: string, key: string) {
    this.db = openEncryptedDatabase(dbPath, key);

    // System queries
    this.user = new UserQueries(this.db);
    this.audit = new AuditQueries(this.db);

    // Sync queries
    this.sync = new SyncQueries(this.db);

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

    // Item queries
    this.item = new ItemRecordQueries(this.db);
    this.alias = new AliasQueries(this.db);
    this.dimensionMap = new DimensionMapQueries(this.db);
    this.systemMap = new SystemMapQueries(this.db);
    this.tagMap = new TagMapQueries(this.db);
    this.generationRules = new GenerationRulesQueries(this.db);

    // Order queries
    this.requestItem = new RequestItemQueries(this.db);

    // Variant queries
    this.variant = new VariantRecordQueries(this.db);
    this.dimensionValueMap = new DimensionValueMapQueries(this.db);
  }

  close(): void {
    this.db.close();
  }
}
const authDbPath = path.join(app.getPath('userData'), 'auth.db');

export function initializeAuthDatabase(): AuthDatabase {
  let key = getOrGenerateKey('system');
  let db: Database.Database | undefined;

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
    db?.close();
    logger.error(
      {
        scope: 'auth',
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      'Key incorrect or auth DB corrupted, backing up auth data...',
    );
    backupArtifacts('auth', authDbPath);

    key = getOrGenerateKey('system');
    db = new Database(authDbPath);
    setupNewDb('auth', db, key);
    logger.info({ scope: 'auth' }, 'Auth database re-initialized successfully after backup.');
  } finally {
    db?.close();
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
  let db: Database.Database | undefined;

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
    db?.close();
    logger.error(
      {
        scope: 'user',
        uuid,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        rawError: error,
      },
      `Key incorrect or user DB corrupted for UUID ${uuid}, backing up user data...`,
    );
    backupArtifacts('user', userDbPath, uuid);

    key = getOrGenerateKey('user', uuid);
    db = new Database(userDbPath);
    setupNewDb('user', db, key);
    logger.info(
      { scope: 'user', uuid },
      `User database for UUID ${uuid} re-initialized successfully after backup.`,
    );
  } finally {
    db?.close();
  }

  return new UserDatabase(userDbPath, key);
}
