import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '../../libs/db/index.js';
import { statisticsDaily } from './schema.js';

export function incrementDailyStatistic(metric: string, date: string): void {
  db.insert(statisticsDaily)
    .values({ metric, date, value: 1 })
    .onConflictDoUpdate({
      target: [statisticsDaily.metric, statisticsDaily.date],
      set: { value: sql`${statisticsDaily.value} + 1` },
    })
    .run();
}

export function getDailyStatisticsSince(metric: string, startDate: string) {
  return db
    .select({ date: statisticsDaily.date, value: statisticsDaily.value })
    .from(statisticsDaily)
    .where(and(eq(statisticsDaily.metric, metric), gte(statisticsDaily.date, startDate)))
    .all();
}
