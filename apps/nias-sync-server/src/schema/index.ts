/**
 * This file serves as the central export point for all schema definitions in the NIAS Sync Server
 * application. It consolidates and re-exports the schema definitions from various modules,
 * including sync, system, and auth schemas. This allows other parts of the application to import
 * schema definitions from a single location, improving maintainability and organization.
 */

export { syncMetadata, changelog } from './sync.js';
export { users, audit } from './system.js';
export { authUsers } from './auth.js';
