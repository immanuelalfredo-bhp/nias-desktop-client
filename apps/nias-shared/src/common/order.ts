import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import {
  RequestItemSchema as DrizzleRequestItemSchema,
  type RequestItem as DrizzleRequestItem,
} from '../server/schema/order.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      REQUEST ITEM SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RequestItemIdSchema = EntityIdSchema;
export const RequestItemSchema = DrizzleRequestItemSchema;
export type RequestItem = DrizzleRequestItem;

export const CreateRequestItemSchema = RequestItemSchema.omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const UpdateRequestItemSchema = RequestItemSchema.pick({
  id: true,
}).extend(RequestItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).partial().shape);
export const CreateRequestItemInputSchema = CreateRequestItemSchema.omit({
  id: true,
});

export type RequestItemId = z.infer<typeof RequestItemIdSchema>;
export type CreateRequestItem = z.infer<typeof CreateRequestItemSchema>;
export type UpdateRequestItem = z.infer<typeof UpdateRequestItemSchema>;
export type CreateRequestItemInput = z.infer<typeof CreateRequestItemInputSchema>;
