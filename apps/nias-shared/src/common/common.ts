import { z } from 'zod';
import * as schemas from './defines.js';

export const EntityIdSchema = z.object({
  id: schemas.uuid,
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type EntityId = z.infer<typeof EntityIdSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
