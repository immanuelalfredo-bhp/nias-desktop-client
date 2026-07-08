import 'dotenv/config';
import { auth, logger, sync } from '@nias/shared';
import app, { registerErrorHandlers } from './app.js';
import { SHUTDOWN_TIMEOUT } from './config.js';
import { closeDb } from './db.js';
import {
  appAuthenticate,
  bootstrapAuthenticate,
  userAuthenticate,
  validate,
} from './middleware.js';
import { getBootstrapStatus, handleBootstrap } from './routes/bootstrap.js';
import { initialLogin, syncLocalUsers } from './routes/login.js';
import { handlePull, handlePush } from './routes/sync.js';

const shutdownTimeout = SHUTDOWN_TIMEOUT;
const PORT = Number(process.env.PORT || 3000);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/sync/push', userAuthenticate, validate(sync.PushPayloadSchema), (req, res, next) => {
  const context = {
    log: req.log,
    ...(req.user?.id ? { userId: req.user.id } : {}),
  };

  return handlePush(req.validatedBody as sync.PushPayload, context)
    .then((result) => res.json(result))
    .catch(next);
});

app.post('/api/sync/pull', userAuthenticate, validate(sync.SyncMetadataSchema), (req, res, next) =>
  handlePull(req, res).catch(next),
);

app.post(
  '/api/login/initial',
  appAuthenticate,
  validate(auth.LoginCredentialsSchema),
  (req, res, next) => {
    const context = {
      log: req.log,
    };

    return initialLogin(req.validatedBody as auth.LoginCredentials, context)
      .then((result) => {
        if (!result) {
          return res.status(404).json({
            success: false,
            message: 'User not found or password is incorrect',
          });
        }

        return res.json({ success: true, user: result });
      })
      .catch(next);
  },
);

app.post(
  '/api/login/sync',
  appAuthenticate,
  validate(auth.LoginSyncStateSchema),
  (req, res, next) => {
    const context = {
      log: req.log,
    };

    return syncLocalUsers(req.validatedBody as auth.LoginSyncState, context)
      .then((result) => res.json({ success: true, result }))
      .catch(next);
  },
);

app.post('/api/bootstrap/status', bootstrapAuthenticate, (req, res, next) =>
  getBootstrapStatus(req, res).catch(next),
);

app.post(
  '/api/bootstrap/execute',
  bootstrapAuthenticate,
  validate(auth.BootstrapPayloadSchema),
  (req, res, next) => {
    const context = {
      log: req.log,
    };

    return handleBootstrap(req.validatedBody as auth.BootstrapPayload, context)
      .then((result) => res.json({ success: true, result }))
      .catch(next);
  },
);

const server = app.listen(PORT, () => {
  logger.info(
    { scope: 'server', port: PORT, nodeEnv: process.env.NODE_ENV },
    'Sync server is listening',
  );
});

registerErrorHandlers(app);

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing server');

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }

    try {
      await closeDb();
      logger.info({ scope: 'db' }, 'Database connection closed');
      process.exit(0);
    } catch (dbErr) {
      logger.error({ scope: 'db', dbErr }, 'Error closing database connection');
      process.exit(1);
    }
  });

  setTimeout(() => {
    // We force-exit if the DB/Server fails to close within the timeout,
    // ensuring the container or process doesn't hang indefinitely.
    logger.error(
      { scope: 'server', timeoutSeconds: shutdownTimeout / 1000 },
      'Forcing shutdown after timeout',
    );
    process.exit(1);
  }, shutdownTimeout);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
