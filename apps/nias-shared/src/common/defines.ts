import { z } from 'zod';

const argon2Regex = new RegExp(
  '^\\$argon2(?:i|d|id)\\$v=\\d+\\$m=\\d+,t=\\d+,p=\\d+' +
    '\\$[A-Za-z0-9+/]+={0,2}\\$[A-Za-z0-9+/]+={0,2}$',
);

const dateTransformer = z.string().transform((val) => {
  // SQLite "YYYY-MM-DD HH:MM:SS" -> ISO 8601 "YYYY-MM-DDTHH:MM:SS.sssZ"
  return new Date(val.replace(' ', 'T') + 'Z').toISOString();
});

export const uuid = z.uuid();
export const displayName = z.string().trim().max(100).default('');
export const email = z.email();
export const password = z.string().min(1);
export const passwordHash = z.string().regex(argon2Regex);
export const syncVersion = z.number().int().nonnegative().default(0);
export const jwtToken = z.string();
export const jwtTokenExpiration = z.number().int().nonnegative();

export const genericString = z.string().trim().min(1).max(100);
export const genericBlob = z.string().trim().min(1).max(1000);
export const dateTime = dateTransformer;
