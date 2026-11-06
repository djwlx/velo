import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const statisticsDaily = sqliteTable(
  'velo_statistics_daily',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    metric: text('metric').notNull(),
    date: text('date').notNull(),
    value: integer('value').notNull().default(0),
  },
  (table) => ({
    metricDateUnique: uniqueIndex('velo_statistics_daily_metric_date_unique').on(
      table.metric,
      table.date,
    ),
  }),
);
