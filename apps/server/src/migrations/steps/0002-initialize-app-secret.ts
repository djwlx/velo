import { randomBytes } from 'node:crypto';
import {
  lstatSync,
  openSync,
  closeSync,
  constants,
  fsyncSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { readAppSecret } from '../../config/app-secret.js';
import type { MigrationContext } from '../types.js';
import { MigrationError } from '../types.js';

export function up({ sqlite, dataDirectory }: MigrationContext): undefined {
  const filename = path.join(dataDirectory, 'app-secret');
  if (lstatSync(filename, { throwIfNoEntry: false })) {
    readAppSecret(dataDirectory);
    return;
  }

  const existing = sqlite
    .prepare(
      'SELECT EXISTS (SELECT 1 FROM velo_users) OR EXISTS (SELECT 1 FROM velo_config) AS present',
    )
    .get() as { present: number };
  if (existing.present) {
    throw new MigrationError('Existing data has no app-secret file. Restore it from backup.');
  }

  const temporary = path.join(dataDirectory, 'app-secret.tmp');
  rmSync(temporary, { force: true });
  try {
    writeFileSync(temporary, randomBytes(32).toString('base64url'), {
      flag: 'wx',
      mode: 0o600,
      flush: true,
    });
    if (lstatSync(filename, { throwIfNoEntry: false })) {
      throw new MigrationError(
        'data/app-secret appeared during initialization. Restart to reuse it.',
      );
    }
    renameSync(temporary, filename);
    if (process.platform !== 'win32') {
      const directoryFd = openSync(dataDirectory, constants.O_RDONLY | constants.O_DIRECTORY);
      try {
        fsyncSync(directoryFd);
      } finally {
        closeSync(directoryFd);
      }
    }
  } finally {
    rmSync(temporary, { force: true });
  }
}
