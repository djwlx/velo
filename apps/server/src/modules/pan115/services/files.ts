import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';

import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { fail, success } from '../../../utils/response.js';
import { buildContentDisposition } from '../../../utils/string.js';
import type { Pan115Env } from '../types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const parsePositiveInteger = (value: string | undefined, fallback: number): number | undefined => {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : undefined;
};

export const getFiles: Handler<Pan115Env> = async (c) => {
  const cid = c.req.param('cid')?.trim() ?? '';

  const page = parsePositiveInteger(c.req.query('page'), DEFAULT_PAGE);
  const pageSize = parsePositiveInteger(c.req.query('pageSize'), DEFAULT_PAGE_SIZE);
  if (page === undefined || pageSize === undefined || pageSize > MAX_PAGE_SIZE) {
    return c.json(fail('pageRange', ErrorCode.ValidationFailed, { max: MAX_PAGE_SIZE }), 400);
  }

  try {
    const sdk = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
    const offset = (page - 1) * pageSize;
    if (!Number.isSafeInteger(offset)) {
      return c.json(fail('pageTooLarge', ErrorCode.ValidationFailed), 400);
    }
    const result = await sdk.getFileList(offset, pageSize, cid);

    const items = result.data.map((item) => ({
      cid: item.cid,
      name: item.n,
      pickCode: item.pc || null,
      isDirectory: !item.fid,
      type: item.class || null,
      size: item.fid ? item.s : 0,
    }));

    const path = (result.path ?? []).map((item) => ({
      cid: item.cid,
      name: item.name,
    }));

    return c.json(
      success({
        cid,
        page,
        pageSize,
        total: result.count,
        path,
        items,
      }),
    );
  } catch (error) {
    c.get('logger').error(
      { error: error instanceof Error ? error.message : 'unknown error', cid },
      '115 file list failed',
    );
    return c.json(fail('fetch115FilesFailed', ErrorCode.ExternalServiceFailed), 502);
  }
};

const isInlinePreviewable = (mime: string): boolean =>
  mime.startsWith('image/') ||
  mime.startsWith('video/') ||
  mime.startsWith('audio/') ||
  mime === 'application/pdf';

export const getFile: Handler<Pan115Env> = async (c) => {
  const pickCode = c.req.param('pickCode')?.trim() ?? '';
  if (!pickCode) {
    return c.json(fail('pickCodeRequired', ErrorCode.ValidationFailed), 400);
  }

  try {
    const sdk = new Pan115Sdk(c.get('cookie115'), c.req.header('User-Agent'));
    const fileInfo = await sdk.getFile(pickCode);
    const range = c.req.header('Range');
    const headers: Record<string, string> = { 'User-Agent': sdk.userAgent };
    if (range) headers.Range = range;
    const response = await fetch(fileInfo.url, { headers });

    if (!response.ok || !response.body) {
      return c.json(fail('download115FileFailed', ErrorCode.ExternalServiceFailed), 502);
    }

    const dispositionType = isInlinePreviewable(fileInfo.mime) ? 'inline' : 'attachment';
    const upstreamLength = response.headers.get('Content-Length') ?? String(fileInfo.file_size);

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Accept-Ranges': response.headers.get('Accept-Ranges') ?? 'bytes',
        'Cache-Control': 'private, no-store',
        'Content-Type': fileInfo.mime,
        'Content-Length': upstreamLength,
        'Content-Disposition': buildContentDisposition(fileInfo.file_name, dispositionType),
        ...(response.status === 206 && response.headers.get('Content-Range')
          ? { 'Content-Range': response.headers.get('Content-Range')! }
          : {}),
      },
    });
  } catch (error) {
    c.get('logger').error(
      { error: error instanceof Error ? error.message : 'unknown error' },
      '115 file download failed',
    );
    return c.json(fail('download115FileFailed', ErrorCode.ExternalServiceFailed), 502);
  }
};
