import type { AppMigration, MigrationContext } from './types.js';
import { MigrationError } from './types.js';

interface MigrationRecord {
  id: string;
  checksum: string;
}

export function runAppMigrations(
  context: MigrationContext,
  migrations: readonly AppMigration[],
): string[] {
  const { sqlite } = context;
  const applied: string[] = [];
  const registered = new Map<string, AppMigration>();
  let previousId = '';

  for (const migration of migrations) {
    if (
      !/^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(migration.id) ||
      !/^[a-f0-9]{64}$/.test(migration.checksum) ||
      migration.id <= previousId
    ) {
      throw new MigrationError('Invalid application migration registry.');
    }
    registered.set(migration.id, migration);
    previousId = migration.id;
  }

  // Commit database changes and completion records together.
  sqlite.transaction(() => {
    const records = sqlite
      .prepare('SELECT id, checksum FROM velo_app_migrations ORDER BY id')
      .all() as MigrationRecord[];
    for (const [index, record] of records.entries()) {
      if (
        registered.get(record.id)?.checksum !== record.checksum ||
        migrations[index]?.id !== record.id
      ) {
        throw new MigrationError(
          'Application migration history does not match this build. Restore the matching build or add a new migration.',
        );
      }
    }

    const recordCompletion = sqlite.prepare(
      'INSERT INTO velo_app_migrations (id, checksum, applied_at) VALUES (?, ?, ?)',
    );
    for (const migration of migrations.slice(records.length)) {
      try {
        migration.up(context);
        recordCompletion.run(migration.id, migration.checksum, Date.now());
        applied.push(migration.id);
      } catch (error) {
        if (error instanceof MigrationError) throw error;
        // Driver errors can contain SQL values. Only expose the fixed migration ID.
        throw new MigrationError(
          `Application migration ${migration.id} failed. Check data directory access and retry.`,
        );
      }
    }
  })();

  return applied;
}
