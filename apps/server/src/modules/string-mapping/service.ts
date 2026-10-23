import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { db } from '../../libs/db/index.js';
import { stringMappings } from './schema.js';
import { mappingNamespaceSchema, mappingValueSchema, stringIdSchema } from './validation.js';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Internal service: callers retain responsibility for resource authorization.
export const getOrCreateStringId = (namespace: string, value: string): string => {
  mappingNamespaceSchema.parse(namespace);
  mappingValueSchema.parse(value);
  const find = () =>
    db
      .select({ id: stringMappings.id })
      .from(stringMappings)
      .where(and(eq(stringMappings.namespace, namespace), eq(stringMappings.value, value)))
      .get();
  const existing = find();
  if (existing) return existing.id;

  for (let attempt = 0; attempt < 10; attempt++) {
    const id = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join(
      '',
    );
    db.insert(stringMappings).values({ id, namespace, value }).onConflictDoNothing().run();
    // Reading by value also handles another process inserting the same value first.
    const entry = find();
    if (entry) return entry.id;
  }
  throw new Error('Unable to allocate string ID');
};

export const resolveStringId = (namespace: string, id: string): string | undefined => {
  mappingNamespaceSchema.parse(namespace);
  if (!stringIdSchema.safeParse(id).success) return undefined;
  return db
    .select({ value: stringMappings.value })
    .from(stringMappings)
    .where(and(eq(stringMappings.namespace, namespace), eq(stringMappings.id, id)))
    .get()?.value;
};
