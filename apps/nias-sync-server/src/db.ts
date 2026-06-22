import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// The URL is now accessible because dotenv loaded it
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the .env file");
}

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

export const closeDb = async () => {
  await queryClient.end();
};