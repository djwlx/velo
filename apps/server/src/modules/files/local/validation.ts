import { z } from 'zod';

export const localPathSchema = z
  .string()
  .max(4096)
  .refine((value) => {
    // oxlint-disable-next-line no-control-regex -- Reject control characters in filesystem paths.
    if (/[\\\u0000-\u001f\u007f]/.test(value) || /%(?:2e|2f|5c|00|25)/i.test(value)) {
      return false;
    }
    if (value === '') return true;
    const segments = value.split('/');
    return (
      segments.length <= 128 &&
      segments.every((part) => part !== '' && part !== '.' && part !== '..')
    );
  });

export const localListQuerySchema = z.object({
  path: localPathSchema.default(''),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const localContentQuerySchema = z.object({
  path: localPathSchema.refine((value) => value.length > 0),
  download: z.enum(['0', '1']).default('0'),
});
