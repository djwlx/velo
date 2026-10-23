import { z } from 'zod';

export const stringIdSchema = z.string().regex(/^[a-z0-9]{6}$/);
export const mappingNamespaceSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/);
export const mappingValueSchema = z.string().max(16384);
