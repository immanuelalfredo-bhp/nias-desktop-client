import 'dotenv/config';
import app, { registerErrorHandlers } from './app.js';
import { closeDb } from './db.js';
import { authenticate, bootstrapAuthenticate, validate } from './middleware.js';
import { handlePush, handlePull, getBootstrapStatus, handleBootstrap } from './routes/sync.js';
import { sharedSync } from '@nias/shared';
import { SHUTDOWN_TIMEOUT } from './config.js';
import { logger } from './logger.js';
import type { Request, Response, NextFunction } from 'express'; // 1. Import NextFunction

require('dns').setDefaultResultOrder('ipv4first');

console.log("--- STARTUP ENVIRONMENT CHECK ---");
console.log("DATABASE_URL from process.env:", process.env.DATABASE_URL);
// Check for any other common environment variable names
console.log("PGDATABASE:", process.env.PGDATABASE); 
console.log("DB_URL:", process.env.DB_URL);

console.log("--- DEBUGGING CONNECTION ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Full DB URL from process.env:", process.env.DATABASE_URL);

const shutdownTimeout = SHUTDOWN_TIMEOUT;
const PORT = Number(process.env.PORT || 3000);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post(
  '/api/sync/push',
  authenticate,
  validate(sharedSync.PushPayloadSchema),
  (req, res, next) => {
    const context = {
      log: req.log,
      ...(req.user?.id ? { userId: req.user.id } : {}),
    };

    return handlePush(req.validatedBody as sharedSync.PushPayload, context)
      .then(result => res.json(result))
      .catch(next);
  }
);

app.post(
  '/api/sync/pull',
  authenticate,
  validate(sharedSync.SyncMetadataSchema),
  (req, res, next) => handlePull(req, res).catch(next)
);

app.post(
  '/api/bootstrap/status',
  bootstrapAuthenticate,
  (req, res, next) => getBootstrapStatus(req, res).catch(next)
);

app.post(
  '/api/bootstrap/execute',
  bootstrapAuthenticate,
  validate(sharedSync.PushPayloadSchema),
  (req, res, next) => {
    const context = {
      log: req.log,
    };

    return handleBootstrap(req.validatedBody as sharedSync.PushPayload, context)
      .then(result => res.json(result))
      .catch(next);
  }
);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('--- CAUGHT ERROR IN MIDDLEWARE ---');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack:', err.stack);
  next(err); // Pass it on to your standard error handler
});

registerErrorHandlers(app);

const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, nodeEnv: process.env.NODE_ENV },
    'Sync server is listening'
  );
});

/**
 * Handles graceful process shutdown by closing the HTTP server and database
 * connections before forcing termination at timeout.
 */
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing server');

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }

    try {
      await closeDb();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (dbErr) {
      logger.error({ dbErr }, 'Error closing database connection');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error(
      { timeoutSeconds: shutdownTimeout / 1000 },
      'Forcing shutdown after timeout'
    );
    process.exit(1);
  }, shutdownTimeout);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));