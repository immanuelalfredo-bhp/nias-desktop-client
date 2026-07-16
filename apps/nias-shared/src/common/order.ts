import { z } from 'zod';
import { EntityIdSchema, CreateOmissions, UpdateOmissions } from './common.js';
import {
  RequestSchema as DrizzleRequestSchema,
  RequestItemSchema as DrizzleRequestItemSchema,
  type Request as DrizzleRequest,
  type RequestItem as DrizzleRequestItem,
} from '../server/schema/order.js';

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                        REQUEST SCHEMAS                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RequestIdSchema = EntityIdSchema;
export const RequestSchema = DrizzleRequestSchema;
export type Request = DrizzleRequest;

export const CreateRequestSchema = RequestSchema.omit(CreateOmissions);
export const UpdateRequestSchema = RequestSchema.pick({
  id: true,
}).extend(RequestSchema.omit(UpdateOmissions).partial().shape);
export const CreateRequestInputSchema = CreateRequestSchema.omit({
  id: true,
});

export type RequestId = z.infer<typeof RequestIdSchema>;
export type CreateRequest = z.infer<typeof CreateRequestSchema>;
export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;
export type CreateRequestInput = z.infer<typeof CreateRequestInputSchema>;

// ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
// ║                                      REQUEST ITEM SCHEMAS                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

export const RequestItemIdSchema = EntityIdSchema;
export const RequestItemSchema = DrizzleRequestItemSchema;
export type RequestItem = DrizzleRequestItem;

export const CreateRequestItemSchema = RequestItemSchema.omit(CreateOmissions);
export const UpdateRequestItemSchema = RequestItemSchema.pick({
  id: true,
}).extend(RequestItemSchema.omit(UpdateOmissions).partial().shape);
export const CreateRequestItemInputSchema = CreateRequestItemSchema.omit({
  id: true,
});

export type RequestItemId = z.infer<typeof RequestItemIdSchema>;
export type CreateRequestItem = z.infer<typeof CreateRequestItemSchema>;
export type UpdateRequestItem = z.infer<typeof UpdateRequestItemSchema>;
export type CreateRequestItemInput = z.infer<typeof CreateRequestItemInputSchema>;
