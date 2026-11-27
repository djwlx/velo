import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';

import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { randomInt } from '../../../utils/number.js';
import { fail, success } from '../../../utils/response.js';
import { buildContentDisposition, escapeHtml } from '../../../utils/string.js';
import { formatLocalDate } from '../../../utils/time.js';
import { RANDOM_PIC_ACCESS_METRIC } from '../../statistics/metrics.js';
import { incrementDailyStatistic } from '../../statistics/repository.js';
import { getFileByIndex, getFileCount } from '../repositories/files.js';
import type { Pan115Env } from '../types.js';
import { createCacheHandler, createClearHandler } from './cache.js';

const PIC_CACHE_LOCK_KEY = 'pan115-pic-cache';

export const getRandomPic: Handler<Pan115Env> = async (c) => {
  const cookie = c.get('cookie115');
  const userAgent = c.req.header('User-Agent');
  const mode = c.req.query('mode');
  const isModeJson = mode === 'json';
  const isModeHtml = mode === 'html';
  const client115 = new Pan115Sdk(cookie, isModeJson || isModeHtml ? userAgent : '');
  const count = getFileCount('PIC');
  if (!count) {
    return c.json(fail('noCachedPic', ErrorCode.ResourceNotFound), 404);
  }
  const pic = getFileByIndex('PIC', randomInt(0, count - 1));
  if (!pic) {
    return c.json(fail('noCachedPic', ErrorCode.ResourceNotFound), 404);
  }

  const fileInfo = await client115.getFile(pic.pc_code);
  if (isModeJson) {
    incrementDailyStatistic(RANDOM_PIC_ACCESS_METRIC, formatLocalDate());
    return c.json(success(fileInfo));
  }

  if (isModeHtml) {
    const url = escapeHtml(fileInfo.url);
    const name = escapeHtml(fileInfo.file_name);
    incrementDailyStatistic(RANDOM_PIC_ACCESS_METRIC, formatLocalDate());
    return c.html(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000"><img src="${url}" alt="${name}" style="max-width:100%;max-height:100vh"></body></html>`,
    );
  }

  const res = await fetch(fileInfo.url, {
    headers: {
      'User-Agent': client115.userAgent,
      Referer: 'https://115.com/',
    },
  });
  if (!res.ok || !res.body) {
    throw new Error(`download failed: ${res.status}`);
  }
  incrementDailyStatistic(RANDOM_PIC_ACCESS_METRIC, formatLocalDate());
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': fileInfo.mime,
      'Content-Length': res.headers.get('Content-Length') ?? fileInfo.file_size,
      'Content-Disposition': buildContentDisposition(fileInfo.file_name),
    },
  });
};

export const cacheFileIdInDB = createCacheHandler('PIC', PIC_CACHE_LOCK_KEY, 'picCacheRunning');

export const clearPicsHandler = createClearHandler('PIC', PIC_CACHE_LOCK_KEY, 'picCacheRunning');
