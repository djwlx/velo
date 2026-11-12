import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appMigrations = sqliteTable('velo_app_migrations', {
  id: text('id').primaryKey().notNull(),
  checksum: text('checksum').notNull(),
  appliedAt: integer('applied_at', { mode: 'timestamp_ms' }).notNull(),
});
