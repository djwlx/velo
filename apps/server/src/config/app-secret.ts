import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from 'node:fs';
import path from 'node:path';

import { MigrationError } from '../migrations/types.js';

export function readAppSecret(dataDirectory = path.resolve(process.cwd(), 'data')): string {
  let fd: number | undefined;
  try {
    const filename = path.join(dataDirectory, 'app-secret');
    if (!lstatSync(filename).isFile()) {
      throw new MigrationError('data/app-secret must be a regular file, without symbolic links.');
    }
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > 4096) {
      throw new MigrationError(
        'data/app-secret must be a private file containing 1 to 4096 bytes.',
      );
    }
    const buffer = Buffer.alloc(4097);
    let length = 0;
    while (length < buffer.length) {
      const bytesRead = readSync(fd, buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length < 1 || length > 4096) {
      throw new MigrationError('data/app-secret must contain 1 to 4096 bytes.');
    }
    if ((stat.mode & 0o777) !== 0o600) fchmodSync(fd, 0o600);
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      buffer.subarray(0, length),
    );
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    throw new MigrationError(
      'Cannot read data/app-secret. Check permissions or restore it from backup.',
    );
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}
