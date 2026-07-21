import { z } from 'zod';

const argon2Regex = new RegExp(
  '^\\$argon2(?:i|d|id)\\$v=\\d+\\$m=\\d+,t=\\d+,p=\\d+' +
    '\\$[A-Za-z0-9+/]+={0,2}\\$[A-Za-z0-9+/]+={0,2}$',
);

const dateTransformer = z.string().transform((val) => {
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date-time string');
  }
  return date.toISOString();
});

export const uuid = z.uuid();
export const displayName = z.string().trim().max(100).default('');
export const email = z.email();
export const password = z.string().min(1);
export const passwordHash = z.string().regex(argon2Regex);
export const syncVersion = z.number().int().nonnegative().default(0);
export const jwtToken = z.string();
export const jwtTokenExpiration = z.number().int().nonnegative();

export const sortOrder = z.number().nonnegative().max(100).default(0);

// Enumerations
export const scope = z.enum(['global', 'contextual']);
export const position = z.enum(['prefix', 'suffix', 'parenthesis', 'append']);
export const skuSource = z.enum(['internal', 'external']);
export const materialType = z.enum(['component', 'assembly']);
export const materialClass = z.enum(['main', 'installation', 'support']);
export const creationSource = z.enum(['system', 'user']);
export const delimiterType = z.enum(['cross', 'pipe']);

// SKU codes
export const skuBrand = z.string().regex(/^[A-Z0-9]{2}$/);
export const skuVendor = z.string().regex(/^[A-Z0-9]{3}$/);
export const skuGeneric = z.string().regex(/^[A-Z0-9-]{1,20}$/);

// Generic types
export const string = z.string().trim().min(1).max(100);
export const blob = z.string().trim().min(1).max(1000);
export const jsonb = z.any()
export const boolean = z.boolean();
export const integer = z.number().int();
export const float = z.number();
export const dateTime = dateTransformer;
export const slug = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
