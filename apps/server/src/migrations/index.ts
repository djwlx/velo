import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { up as initializeAppSecret } from './steps/0002-initialize-app-secret.js';
import type { AppMigration } from './types.js';

// Append migrations here; never edit an already released step.
const migrations = [
  {
    id: '0002-initialize-app-secret',
    source: new URL('../../src/migrations/steps/0002-initialize-app-secret.ts', import.meta.url),
    up: initializeAppSecret,
  },
];

export function loadAppMigrations(): AppMigration[] {
  // Ship the original steps alongside dist so source and compiled startup use
  // identical checksums, independent of TypeScript's emitted formatting.
  return [
    // Retired migration: keep its original fingerprint for existing journals.
    // New installations record this baseline without running legacy env logic.
    {
      id: '0001-persist-app-secret',
      checksum: 'da0b0b0050b14ada5a68154d762c35e8a238152111464bb02883616285114e7d',
      up: () => undefined,
    },
    ...migrations.map(({ id, source, up }) => ({
      id,
      checksum: createHash('sha256').update(readFileSync(source)).digest('hex'),
      up,
    })),
  ];
}
