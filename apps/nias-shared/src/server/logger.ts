import pino, { type LoggerOptions } from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'nias',
    env: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: ['req.headers.authorization', 'authorization', 'password', 'passwordHash'],
    remove: true,
  },
};

if (!isProduction) {
  // Keep development logging in-process to avoid worker-thread transport
  // resolution issues in Electron bundles.
  loggerOptions.level = process.env.LOG_LEVEL || 'debug';
}

export const logger = pino(loggerOptions);

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const requestId = req.headers['x-request-id'];
    const reqId = typeof requestId === 'string' && requestId.length > 0 ? requestId : randomUUID();
    res.setHeader('x-request-id', reqId);
    return reqId;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`,
});
