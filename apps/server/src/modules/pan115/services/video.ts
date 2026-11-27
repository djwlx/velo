import { ErrorCode } from '@velo/shared';
import type { Context, Handler } from 'hono';

import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { randomInt } from '../../../utils/number.js';
import { fail, success } from '../../../utils/response.js';
import { formatLocalDate } from '../../../utils/time.js';
import { RANDOM_VIDEO_ACCESS_METRIC } from '../../statistics/metrics.js';
import { incrementDailyStatistic } from '../../statistics/repository.js';
import {
  getAvailableFileByIndex,
  getAvailableFileCount,
  getFileByIndex,
  getFileByPickCode,
  getFileCount,
} from '../repositories/files.js';
import type { Pan115Env } from '../types.js';
import { createCacheHandler, createClearHandler } from './cache.js';

const VIDEO_CACHE_LOCK_KEY = 'pan115-video-cache';
const VIDEO_STREAM_PATH = '/api/115/video/random';
const HLS_MIME = 'application/vnd.apple.mpegurl';
const HLS_URI_ATTRIBUTE = /(URI=")([^"]+)(")/g;
const MAX_EXCLUDED_PICK_CODES = 500;
const PICK_CODE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

type HonoContext = Context<Pan115Env>;
type BuildProxyUrl = (url: string) => string;

export function parseExcludedPickCodes(values: string[]): string[] {
  return [
    ...new Set(
      values
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter((value) => PICK_CODE_PATTERN.test(value)),
    ),
  ].slice(0, MAX_EXCLUDED_PICK_CODES);
}

export function isAllowed115VideoUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    if (url.hostname !== '115.com' && !url.hostname.endsWith('.115.com')) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

const toProxyUrl = (pickCode: string, url: string): string => {
  const params = new URLSearchParams({ pickCode, url });
  return `${VIDEO_STREAM_PATH}?${params.toString()}`;
};

const resolveAllowedUrl = (value: string, baseUrl: string): string | undefined => {
  try {
    const resolved = new URL(value, baseUrl);
    return isAllowed115VideoUrl(resolved.toString())?.toString();
  } catch {
    return undefined;
  }
};

export function rewriteHlsPlaylist(
  playlist: string,
  sourceUrl: string,
  pickCode: string,
  buildProxyUrl: BuildProxyUrl = (url) => toProxyUrl(pickCode, url),
): string {
  return playlist
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(
          HLS_URI_ATTRIBUTE,
          (match: string, prefix: string, uri: string, suffix: string) => {
            const resolved = resolveAllowedUrl(uri, sourceUrl);
            return resolved ? `${prefix}${buildProxyUrl(resolved)}${suffix}` : match;
          },
        );
      }

      const resolved = resolveAllowedUrl(trimmed, sourceUrl);
      return resolved ? buildProxyUrl(resolved) : line;
    })
    .join('\n');
}

const isPlaylistUrl = (url: string): boolean =>
  new URL(url).pathname.toLowerCase().endsWith('.m3u8');

const proxyUpstream = async (
  c: HonoContext,
  url: string,
  pickCode: string,
  buildProxyUrl: BuildProxyUrl = (resourceUrl) => toProxyUrl(pickCode, resourceUrl),
): Promise<Response> => {
  const client115 = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
  const headers: Record<string, string> = {
    Accept: '*/*',
    Cookie: c.get('cookie115'),
    Referer: 'https://115.com/',
    'User-Agent': client115.userAgent,
  };
  const range = c.req.header('Range');
  if (range) headers.Range = range;

  const upstream = await fetch(url, { headers });
  if (!upstream.ok || !upstream.body) {
    throw new Error(`115 video stream request failed: ${upstream.status}`);
  }

  if (isPlaylistUrl(url)) {
    const playlist = await upstream.text();
    return new Response(rewriteHlsPlaylist(playlist, url, pickCode, buildProxyUrl), {
      status: upstream.status,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': HLS_MIME,
      },
    });
  }

  const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim();
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Accept-Ranges': upstream.headers.get('Accept-Ranges') ?? 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType || 'application/octet-stream',
      ...(upstream.headers.get('Content-Length')
        ? { 'Content-Length': upstream.headers.get('Content-Length')! }
        : {}),
      ...(upstream.status === 206 && upstream.headers.get('Content-Range')
        ? { 'Content-Range': upstream.headers.get('Content-Range')! }
        : {}),
    },
  });
};

export const getRandomVideo: Handler<Pan115Env> = async (c) => {
  const pickCode = c.req.query('pickCode')?.trim();
  const upstreamUrl = c.req.query('url')?.trim();
  const excluded = parseExcludedPickCodes([
    ...(c.req.queries('exclude') ?? []),
    ...(c.req.query('exclude')?.split(',') ?? []),
  ]);

  try {
    let video: ReturnType<typeof getFileByPickCode>;

    if (pickCode) {
      video = getFileByPickCode('AVI', pickCode);
    } else if (excluded.length) {
      const count = getAvailableFileCount('AVI', excluded);
      video = count ? getAvailableFileByIndex('AVI', randomInt(0, count - 1), excluded) : undefined;
    } else {
      const count = getFileCount('AVI');
      video = count ? getFileByIndex('AVI', randomInt(0, count - 1)) : undefined;
    }

    if (!video) {
      return c.json(fail('noCachedVideo', ErrorCode.ResourceNotFound), 404);
    }

    if (upstreamUrl) {
      if (!pickCode) {
        return c.json(fail('invalidRequest', ErrorCode.ValidationFailed), 400);
      }
      const allowedUrl = isAllowed115VideoUrl(upstreamUrl);
      if (!allowedUrl) {
        return c.json(fail('invalidRequest', ErrorCode.ValidationFailed), 400);
      }
      return await proxyUpstream(c, allowedUrl.toString(), pickCode);
    }

    const client115 = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
    const videoInfo = await client115.getVideo(video.pc_code);
    if (!pickCode) {
      incrementDailyStatistic(RANDOM_VIDEO_ACCESS_METRIC, formatLocalDate());
    }

    if (c.req.query('mode') === 'json') {
      return c.json(
        success({
          pickCode: video.pc_code,
          name: videoInfo.file_name || video.name,
          mime: HLS_MIME,
          sizeBytes: videoInfo.file_size || video.size_bytes,
          url: `${VIDEO_STREAM_PATH}?pickCode=${encodeURIComponent(video.pc_code)}`,
        }),
      );
    }

    return await proxyUpstream(c, videoInfo.video_url, video.pc_code);
  } catch (error) {
    c.get('logger').error({ err: error, pickCode }, 'random 115 video failed');
    return c.json(fail('download115FileFailed', ErrorCode.ExternalServiceFailed), 502);
  }
};

export const getVideoStream: Handler<Pan115Env> = async (c) => {
  const pickCode = c.req.param('pickCode')?.trim() ?? '';
  if (!pickCode) {
    return c.json(fail('pickCodeRequired', ErrorCode.ValidationFailed), 400);
  }

  const streamPath = `/api/115/video/stream/${encodeURIComponent(pickCode)}`;
  const token = c.req.query('token');
  const buildProxyUrl = (url: string): string => {
    const params = new URLSearchParams({ url });
    if (token) params.set('token', token);
    return `${streamPath}?${params.toString()}`;
  };

  try {
    const upstreamUrl = c.req.query('url')?.trim();
    if (upstreamUrl) {
      const allowedUrl = isAllowed115VideoUrl(upstreamUrl);
      if (!allowedUrl) {
        return c.json(fail('invalidRequest', ErrorCode.ValidationFailed), 400);
      }
      return await proxyUpstream(c, allowedUrl.toString(), pickCode, buildProxyUrl);
    }

    const client115 = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
    const videoInfo = await client115.getVideo(pickCode);
    return await proxyUpstream(c, videoInfo.video_url, pickCode, buildProxyUrl);
  } catch (error) {
    c.get('logger').error({ err: error, pickCode }, '115 video stream failed');
    return c.json(fail('download115FileFailed', ErrorCode.ExternalServiceFailed), 502);
  }
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
