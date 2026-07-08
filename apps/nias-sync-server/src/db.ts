import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { logger } from '@nias/shared';
import * as schema from './schema/index.js';

/**
 * Establishes a connection to the PostgreSQL database using the connection string from the
 * environment variable DATABASE_URL. If the connection string is not defined, it logs an error and
 * throws an exception. The function returns a Drizzle ORM instance for interacting with the
 * database.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error({ scope: 'db' }, 'DATABASE_URL is not defined in the .env file');
  throw new Error('DATABASE_URL is not defined in the .env file');
}
logger.info({ scope: 'db' }, 'Connecting to the database using DATABASE_URL from .env file');

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

export const closeDb = async () => {
  await queryClient.end();
};
