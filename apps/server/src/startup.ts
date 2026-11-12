import { chmodSync, lstatSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { readAppSecret } from './config/app-secret.js';
import { loadAppMigrations } from './migrations/index.js';
import { runAppMigrations } from './migrations/runner.js';
import { MigrationError } from './migrations/types.js';

function ensureRegularPath(filename: string): void {
  const stat = lstatSync(filename, { throwIfNoEntry: false });
  if (stat && !stat.isFile()) {
    throw new MigrationError(
      'Startup database paths must be regular files, without symbolic links.',
    );
  }
}

export function initializeServer(
  options: {
    workingDirectory?: string;
  } = {},
): { appliedMigrations: string[] } {
  const workingDirectory = path.resolve(options.workingDirectory ?? process.cwd());
  const dataDirectory = path.join(workingDirectory, 'data');
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  if (!lstatSync(dataDirectory).isDirectory()) {
    throw new MigrationError('Server data directory must be a directory, without symbolic links.');
  }
  for (const directory of ['uploads', 'files', 'logs']) {
    const target = path.join(dataDirectory, directory);
    if (!lstatSync(target, { throwIfNoEntry: false })) {
      mkdirSync(target, { recursive: true, mode: 0o700 });
    }
    // The operator may map the file browser's root to another directory.
    const metadata = directory === 'files' ? statSync(target) : lstatSync(target);
    if (!metadata.isDirectory()) {
      throw new MigrationError(
        'Server data subdirectories must be directories; only files may be a symbolic link.',
      );
    }
  }

  const databasePath = path.join(dataDirectory, 'index.db');
  ensureRegularPath(databasePath);
  const sqlite = new Database(databasePath);
  try {
    chmodSync(databasePath, 0o600);
    sqlite.pragma('foreign_keys = ON');
    migrate(drizzle(sqlite), {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });
    const context = {
      sqlite,
      dataDirectory,
    };
    if (
      sqlite.prepare('SELECT 1 FROM velo_app_migrations LIMIT 1').get() &&
      !lstatSync(path.join(dataDirectory, 'app-secret'), { throwIfNoEntry: false })
    ) {
      readAppSecret(dataDirectory);
    }
    const appliedMigrations = runAppMigrations(context, loadAppMigrations());
    readAppSecret(dataDirectory);
    return { appliedMigrations };
  } finally {
    sqlite.close();
  }
}
