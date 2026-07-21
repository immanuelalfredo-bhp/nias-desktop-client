import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3-multiple-ciphers';
import { app } from 'electron';
import { logger } from '@nias/shared/server';
import { keyRingFile } from './keyring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupNewDb(type: 'auth' | 'user', db: Database.Database, key: string): void {
  db.pragma(`rekey = '${key}'`);
  db.pragma('journal_mode = WAL');

  if (type === 'auth') {
    ensureAuthDbSchema(db);
    return;
  }

  runMigrations(db);
}

export function ensureAuthDbSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      sync_version INTEGER NOT NULL
    );
  `);
}

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    logger.warn(
      { scope: 'migrations' },
      `Migrations directory does not exist at ${migrationsDir}. No migrations applied.`,
    );
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const alreadyRun = db.prepare('SELECT 1 FROM schema_migrations WHERE filename = ?').get(file);
    if (alreadyRun) {
      continue;
    }

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

export function backupArtifacts(type: 'auth' | 'user', authDbPath: string, uuid?: string): void {
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