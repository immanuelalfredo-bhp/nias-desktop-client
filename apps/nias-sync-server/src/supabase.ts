import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const publicRoleKey = process.env.SUPABASE_PUBLIC_ROLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required');
}

if (!publicRoleKey) {
  throw new Error('SUPABASE_PUBLIC_ROLE_KEY is required');
}

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

logger.info('Supabase client initialized');

export const supabase = createClient(supabaseUrl, publicRoleKey);
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);