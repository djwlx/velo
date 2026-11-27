import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const files115 = sqliteTable(
  'velo_files_115',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pc_code: text('pc_code').notNull().unique(),
    class: text('class'),
    cid: text('cid'),
    name: text('name').notNull().default(''),
    size_bytes: integer('size_bytes').notNull().default(0),
    cached_at: integer('cached_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('velo_files_115_class_id_idx').on(table.class, table.id)],
);
