import { Hono } from 'hono';

import { requirePermission } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { formatLocalDate } from '../../utils/time.js';
import { getPicCount } from '../pan115/repositories/pic.js';
import { RANDOM_PIC_ACCESS_METRIC } from '../statistics/metrics.js';
import { getDailyStatisticsSince } from '../statistics/repository.js';

export const dashboardRoute = new Hono();

dashboardRoute.use('*', requirePermission('admin'));

dashboardRoute.get('/', (c) => {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return formatLocalDate(date);
  });
  const storedStats = getDailyStatisticsSince(RANDOM_PIC_ACCESS_METRIC, dates[0]);
  const countByDate = new Map(storedStats.map(({ date, value }) => [date, value]));
  const dailyRandomPicAccess = dates.map((date) => ({
    date,
    count: countByDate.get(date) ?? 0,
  }));

  return c.json(
    success({
      dailyRandomPicAccess,
      randomPicAccessLast7Days: dailyRandomPicAccess.reduce((total, item) => total + item.count, 0),
      cachedRandomPicCount: getPicCount(),
    }),
  );
});
