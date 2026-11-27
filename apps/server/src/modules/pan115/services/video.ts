import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';

import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { randomInt } from '../../../utils/number.js';
import { fail, success } from '../../../utils/response.js';
import { buildContentDisposition } from '../../../utils/string.js';
import { formatLocalDate } from '../../../utils/time.js';
import { RANDOM_VIDEO_ACCESS_METRIC } from '../../statistics/metrics.js';
import { incrementDailyStatistic } from '../../statistics/repository.js';
import { getFileByIndex, getFileCount } from '../repositories/files.js';
import type { Pan115Env } from '../types.js';
import { createCacheHandler, createClearHandler } from './cache.js';

const VIDEO_CACHE_LOCK_KEY = 'pan115-video-cache';

export const getRandomVideo: Handler<Pan115Env> = async (c) => {
  const count = getFileCount('AVI');
  if (!count) {
    return c.json(fail('noCachedVideo', ErrorCode.ResourceNotFound), 404);
  }

  const video = getFileByIndex('AVI', randomInt(0, count - 1));
  if (!video) {
    return c.json(fail('noCachedVideo', ErrorCode.ResourceNotFound), 404);
  }

  const client115 = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
  const fileInfo = await client115.getFile(video.pc_code);
  incrementDailyStatistic(RANDOM_VIDEO_ACCESS_METRIC, formatLocalDate());

  if (c.req.query('mode') === 'json') {
    return c.json(
      success({
        pickCode: video.pc_code,
        name: fileInfo.file_name,
        mime: fileInfo.mime,
        sizeBytes: fileInfo.file_size,
        url: fileInfo.url,
      }),
    );
  }

  const headers: Record<string, string> = { 'User-Agent': client115.userAgent };
  const range = c.req.header('Range');
  if (range) headers.Range = range;

  const upstream = await fetch(fileInfo.url, { headers });
  if (!upstream.ok || !upstream.body) {
    return c.json(fail('download115FileFailed', ErrorCode.ExternalServiceFailed), 502);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Accept-Ranges': upstream.headers.get('Accept-Ranges') ?? 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': buildContentDisposition(fileInfo.file_name, 'inline'),
      'Content-Length': upstream.headers.get('Content-Length') ?? fileInfo.file_size,
      'Content-Type': fileInfo.mime,
      ...(upstream.status === 206 && upstream.headers.get('Content-Range')
        ? { 'Content-Range': upstream.headers.get('Content-Range')! }
        : {}),
    },
  });
};

export const cacheVideoFileIdInDB = createCacheHandler(
  'AVI',
  VIDEO_CACHE_LOCK_KEY,
  'videoCacheRunning',
);

export const clearVideosHandler = createClearHandler(
  'AVI',
  VIDEO_CACHE_LOCK_KEY,
  'videoCacheRunning',
);
