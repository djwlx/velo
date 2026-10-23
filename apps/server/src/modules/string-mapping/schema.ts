import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const stringMappings = sqliteTable(
  'velo_string_map',
  {
    id: text('id').primaryKey(),
    namespace: text('namespace').notNull(),
    value: text('value').notNull(),
  },
  (table) => [
    uniqueIndex('velo_string_map_namespace_value_unique').on(table.namespace, table.value),
  ],
);
