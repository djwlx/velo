import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { users } from '../auth/user/schema.js';

// Legacy rows remain in the database; local file links now carry their relative path.
export const localFileEntries = sqliteTable('velo_files_local_entries', {
  id: text('id').primaryKey(),
  path: text('path').notNull().unique(),
});

export const uploadedFiles = sqliteTable(
  'velo_files_local',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    storageKey: text('storage_key').notNull(),
    originalName: text('original_name').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    uploaderId: integer('uploader_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('velo_files_local_storage_key_unique').on(table.storageKey),
    index('velo_files_local_uploader_created_at_idx').on(table.uploaderId, table.createdAt),
  ],
);
