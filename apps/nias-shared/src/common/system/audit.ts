import { z } from 'zod';
import {
  AuditSchema as DrizzleAuditSchema,
  type Audit as DrizzleAudit,
} from '../../server/schema/system.js';

export const AuditSchema = DrizzleAuditSchema;
export type Audit = DrizzleAudit;

export const CreateAuditSchema = AuditSchema.omit({
  isSynced: true,
  syncVersion: true,
});

export const CreateAuditInputSchema = CreateAuditSchema.omit({
  id: true,
  userId: true,
  timestamp: true,
});

export type CreateAudit = z.infer<typeof CreateAuditSchema>;
export type CreateAuditInput = z.infer<typeof CreateAuditInputSchema>;
