import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { supabase } from './supabase.js';

/**
 * Validates a Supabase bearer token and attaches the authenticated user
 * to the request.
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.log.warn('Authentication failed: missing bearer token');
      return res
        .status(401)
        .json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.log.warn(
        { supabaseError: error?.message },
        'Authentication failed: invalid token'
      );
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    req.log.debug({ userId: user.id }, 'Request authenticated');
    next();
  } catch (err) {
    req.log.error({ err }, 'Unexpected authentication error');
    next(err);
  }
};

export const bootstrapAuthenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers['bootstrap-secret'];

    if (!authHeader || authHeader !== process.env.BOOTSTRAP_SECRET) {
      req.log.warn('Bootstrap authentication failed: invalid token');
      return res
        .status(401)
        .json({ error: 'Unauthorized: Invalid token' });
    }
    next();
  } catch (err) {
    req.log.error({ err }, 'Unexpected bootstrap authentication error');
    next(err);
  }
}

export const validate = <T>(schema: ZodType<T>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      req.log.warn({ issues: result.error.issues }, 'Request validation failed');
      return res.status(400).json({
        error: 'Invalid request body',
        details: result.error.issues,
      });
    }

    req.validatedBody = result.data;
    next();
  };
};