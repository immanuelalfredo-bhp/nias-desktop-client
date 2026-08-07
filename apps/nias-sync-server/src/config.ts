/** Maximum number of records returned per table in a single sync pull. */
export const SYNC_LIMIT = 100;

/** Sliding window size for API rate limiting (5 minutes). */
export const REQUEST_INTERVAL = 5 * 60 * 1000;

/** Maximum number of API requests allowed within REQUEST_INTERVAL. */
export const REQUEST_LIMIT = 100;

/** Maximum JSON request body size accepted by Express parser. */
export const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '2mb';

/**
 * Time in milliseconds to wait for graceful shutdown completion
 * before forcing process exit.
 */
export const SHUTDOWN_TIMEOUT = 10_000;
