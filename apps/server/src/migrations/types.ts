import type Database from 'better-sqlite3';

export class MigrationError extends Error {}

export interface MigrationContext {
  sqlite: Database.Database;
  dataDirectory: string;
}

export interface AppMigration {
  id: string;
  checksum: string;
  up: (context: MigrationContext) => undefined;
}
