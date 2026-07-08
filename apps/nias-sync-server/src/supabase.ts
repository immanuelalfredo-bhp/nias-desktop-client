import { createClient } from '@supabase/supabase-js';
import { logger } from '@nias/shared';

const supabaseUrl = process.env.SUPABASE_URL;
const publicRoleKey = process.env.SUPABASE_PUBLIC_ROLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  logger.error({ scope: 'supabase' }, 'SUPABASE_URL is not defined in the .env file');
  throw new Error('SUPABASE_URL is required');
}

if (!publicRoleKey) {
  logger.error({ scope: 'supabase' }, 'SUPABASE_PUBLIC_ROLE_KEY is not defined in the .env file');
  throw new Error('SUPABASE_PUBLIC_ROLE_KEY is required');
}

if (!serviceRoleKey) {
  logger.error({ scope: 'supabase' }, 'SUPABASE_SERVICE_ROLE_KEY is not defined in the .env file');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

logger.info({ scope: 'supabase' }, 'Supabase client initialized');

/**
 * Supabase client for public role access
 *
 * @see https://supabase.com/docs/reference/javascript/createclient
 */
export const supabase = createClient(supabaseUrl, publicRoleKey);

/**
 * Supabase client for service role access (admin)
 *
 * @see https://supabase.com/docs/reference/javascript/createclient
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
