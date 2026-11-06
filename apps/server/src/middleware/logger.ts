// src/middleware/logger.ts
import { structuredLogger } from '@hono/structured-logger';
import { getUrlParams } from '@velo/shared';
import type { MiddlewareHandler } from 'hono';

import { rootLogger } from '../libs/logger.js';

export function loggerMiddleware(): MiddlewareHandler {
  return structuredLogger({
    createLogger: (c) => {
      return rootLogger.child({
        requestId: c.var.requestId,
      });
    },
    onResponse: (logger, c, elapsedMs) => {
      if (!c.req.path.startsWith('/api')) return;
      const fields = {
        method: c.req.method,
        path: c.req.path,
        query: getUrlParams(c.req),
        status: c.res.status,
        elapsedMs,
      };

      if (c.res.status >= 500) {
        logger.error(fields, 'request failed');
      } else if (c.res.status >= 400) {
        logger.warn(fields, 'request completed with client error');
      } else {
        logger.info(fields, 'request completed');
      }
    },
  });
}
