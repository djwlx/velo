import { MigrationError } from './migrations/types.js';
import { initializeServer } from './startup.js';

try {
  const { appliedMigrations } = initializeServer();
  for (const id of appliedMigrations) console.info(`Applied application migration: ${id}`);

  if (process.argv.slice(2).includes('--migrate-only')) {
    console.info('Server data and migrations are ready.');
  } else {
    await import('./index.js');
  }
} catch (error) {
  // Never print raw driver/configuration errors, which may contain secrets.
  console.error(
    error instanceof MigrationError
      ? error.message
      : 'Server startup failed. Check data directory access and database migrations.',
  );
  process.exitCode = 1;
}
