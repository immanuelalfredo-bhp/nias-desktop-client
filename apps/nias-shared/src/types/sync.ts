import type { SyncMetadata } from '../schema/sync.js';

/** Version values by table name used by sync reconciliation. */
export interface VersionRegistry {
  user: number;
  audit: number;
  [key: string]: number;
}

/** Outbound delta records grouped by table name. */
export interface SyncChanges {
  user: unknown[];
  audit: unknown[];
  [key: string]: unknown[];
}

/** Valid table identifiers that can participate in sync. */
export type SyncTableName = keyof SyncMetadata;