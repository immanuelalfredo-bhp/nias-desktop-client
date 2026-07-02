import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { REQUEST_LIMIT, REQUEST_INTERVAL } from './config.js';
import type { Request, Response, NextFunction } from 'express';
import { httpLogger, logger } from './logger.js';

const app = express();

// Trust proxy for rate limiting behind Render/Cloudflare/Nginx
app.set('trust proxy', 1);

// Use pino-http for logging HTTP requests with correlation IDs
app.use(httpLogger);

// Use Helmet to set secure HTTP headers
app.use(helmet());

// Configure CORS to allow requests from the specified origin
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// Use compression to gzip responses for better performance
app.use(compression());

// Apply rate limiting to all API routes
const limiter = rateLimit({
  windowMs: REQUEST_INTERVAL,
  max: REQUEST_LIMIT,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Parse JSON bodies for all routes
app.use(express.json());

/**
 * Registers terminal middleware handlers that should run only after all routes
 * are mounted.
 */
export const registerErrorHandlers = (server: express.Express) => {
  server.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  // Global error handler to catch unhandled errors and prevent server crashes
  server.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error({ err }, 'Unhandled request error');
    logger.error({ err }, 'Unhandled application error');

    res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred.',
    });
  });
};

export default app;