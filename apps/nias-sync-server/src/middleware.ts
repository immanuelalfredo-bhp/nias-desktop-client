import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { supabase } from './supabase.js';

export const userAuthenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.log.warn({ scope: 'auth' }, 'Authentication failed: missing bearer token');
      return res
        .status(401)
        .json({ success: false, message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.log.warn(
        { scope: 'auth', supabaseError: error?.message },
        'Authentication failed: invalid token',
      );
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    req.log.debug({ scope: 'auth', userId: user.id }, 'Request authenticated');
    next();
  } catch (err) {
    req.log.error({ scope: 'auth', err }, 'Unexpected authentication error');
    next(err);
  }
};

export const appAuthenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers['app-id'];

    if (typeof authHeader !== 'string' || authHeader !== process.env.APP_ID) {
      req.log.warn({ scope: 'auth' }, 'App authentication failed: invalid token');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
    next();
  } catch (err) {
    req.log.error({ scope: 'auth', err }, 'Unexpected app authentication error');
    next(err);
  }
};

export const bootstrapAuthenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers['bootstrap-secret'];

    if (typeof authHeader !== 'string' || authHeader !== process.env.BOOTSTRAP_SECRET) {
      req.log.warn({ scope: 'auth' }, 'Bootstrap authentication failed: invalid token');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
    next();
  } catch (err) {
    req.log.error({ scope: 'auth', err }, 'Unexpected bootstrap authentication error');
    next(err);
  }
};

export const validate = <T>(schema: ZodType<T>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      req.log.warn({ scope: 'auth', issues: result.error.issues }, 'Request validation failed');
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        details: result.error.issues,
      });
    }

    req.validatedBody = result.data;
    next();
  };
};
