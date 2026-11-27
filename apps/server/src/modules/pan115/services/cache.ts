import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';

import type { MessageKey } from '../../../i18n/index.js';
import { isRunning, runExclusive } from '../../../libs/async-lock.js';
import { rootLogger } from '../../../libs/logger.js';
import type { FileItem } from '../../../libs/pan115/index.js';
import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { fail, success } from '../../../utils/response.js';
import { bulkUpsertFiles, clearFilesByClass } from '../repositories/files.js';
import type { Pan115Env } from '../types.js';
import { fetchRecursively } from '../utils.js';
import { parseCacheIdsRequest } from './cache-ids.js';

export function createCacheHandler(
  fileClass: string,
  lockKey: string,
  runningMessage: MessageKey,
): Handler<Pan115Env> {
  return async (c) => {
    if (isRunning(lockKey)) {
      return c.json(fail(runningMessage, ErrorCode.ResourceConflict), 409);
    }

    const parsed = parseCacheIdsRequest(await c.req.json<unknown>());
    if (!parsed) {
      return c.json(fail('invalidRequest', ErrorCode.InvalidRequest), 400);
    }
    const { cids, delayMs } = parsed;
    const client115 = new Pan115Sdk(c.get('cookie115'));

    let total = 0;
    void runExclusive(async () => {
      try {
        for (const cid of cids) {
          await fetchRecursively(
            client115,
            cid,
            ({ parentCid, items }) => {
              const matched = items.filter(
                (item): item is FileItem =>
                  typeof item.fid === 'string' && item.class === fileClass && Boolean(item.pc),
              );
              const rows = matched.map((item) => ({
                pc_code: item.pc,
                class: fileClass,
                cid: parentCid,
                name: item.n,
                size_bytes: item.fid ? item.s : 0,
                cached_at: new Date(),
              }));
              total += rows.length;
              bulkUpsertFiles(rows);
            },
            { delayMs },
          );
        }
        rootLogger.info({ fileClass, cidCount: cids.length, total }, 'cache 115 files done');
      } catch (error) {
        rootLogger.error({ err: error, fileClass, cidCount: cids.length }, 'cache 115 files failed');
      }
    }, lockKey);

    return c.json(success({ cids, started: true }));
  };
}

export function createClearHandler(
  fileClass: string,
  lockKey: string,
  runningMessage: MessageKey,
): Handler<Pan115Env> {
  return (c) => {
    if (isRunning(lockKey)) {
      return c.json(fail(runningMessage, ErrorCode.ResourceConflict), 409);
    }
    clearFilesByClass(fileClass);
    return c.json(success({ cleared: true }));
  };
}
