import type { User } from '@supabase/supabase-js';

/**
 * Extends the Express Request interface to include additional properties for validated request body
 * and authenticated user information. This allows for type-safe access to these properties in
 * request handlers throughout the application.
 */
declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      user?: User;
    }
  }
}

export {};
