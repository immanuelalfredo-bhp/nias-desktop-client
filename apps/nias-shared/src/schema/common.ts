import { z } from 'zod';

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
