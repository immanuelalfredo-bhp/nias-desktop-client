import argon2 from 'argon2';
import { safeParse, ZodType } from 'zod';
import { logger } from './logger.js';
import { common } from './index.js';

export type Envelope<T> =
  { success: true; message: string; data: T } | { success: false; message: string };

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  return argon2.verify(hash, plainPassword);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

export function isSuccess<T>(response: common.SuccessResponse | T): response is T {
  return (
    (response as common.SuccessResponse).success === undefined ||
    (response as common.SuccessResponse).success === true
  );
}

export async function handleResponse<T>(
  response: Response,
  schema: ZodType<T>,
  scope: string,
): Promise<common.SuccessResponse | T> {
  if (!response.ok) {
    try {
      const json = await response.json();
      const errorData = safeParse(common.SuccessResponseSchema, json);
      if (!errorData.success) {
        logger.error(
          { scope, status: response.status, json },
          'Sync request failed and response is not valid',
        );
        return { success: false, message: 'Sync request failed and response is not valid' };
      }
      const data = errorData.data;
      logger.error({ scope, status: response.status, data }, 'Sync request failed');
      return { success: false, message: data.message || 'Sync request failed' };
    } catch (jsonError) {
      logger.error(
        { scope, status: response.status, jsonError },
        'Sync request failed and response is not JSON',
      );
      return { success: false, message: 'Sync request failed and response is not JSON' };
    }
  }

  const json = await response.json();
  const responseData = safeParse(schema, json);
  if (!responseData.success) {
    logger.error({ scope, data: json }, 'Sync request failed: Invalid response from sync server');
    return { success: false, message: 'Invalid response from sync server' };
  }
  const data = responseData.data;
  return data;
}
