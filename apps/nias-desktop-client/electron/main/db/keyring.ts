import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { app, safeStorage } from 'electron';
import { logger } from '@nias/shared/server';

export interface KeyRing {
  system: { auth: string };
  users: { [uuid: string]: string };
}

export const keyRingFile = path.join(app.getPath('userData'), 'keys.json');

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
  fs.chmodSync(keyRingFile, 0o600);
}

export function getOrGenerateKey(type: 'system' | 'user', uuid?: string): string {
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
    return safeStorage.decryptString(encryptedKeyBuffer);
  }

  if (type === 'user' && uuid) {
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