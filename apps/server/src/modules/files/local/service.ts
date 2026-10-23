import path from 'node:path';
import { Readable } from 'node:stream';

import { ErrorCode } from '@velo/shared';
import type { FileDirectory } from '@velo/shared';
import type { Context, Handler } from 'hono';
import { lookup } from 'mime-types';

import { fail, success } from '../../../utils/response.js';
import { buildContentDisposition } from '../../../utils/string.js';
import { parseByteRange } from './range.js';
import { createLocalFileStore, isMissingFile, LocalFileError } from './repository.js';
import { localContentQuerySchema, localListQuerySchema } from './validation.js';

const store = createLocalFileStore();
const rootBreadcrumb = { path: '/', name: '文件管理' };

const handleLocalError = (c: Context, error: unknown) => {
  if (error instanceof LocalFileError) {
    const code =
      error.status === 400
        ? ErrorCode.ValidationFailed
        : error.status === 403
          ? ErrorCode.PermissionDenied
          : ErrorCode.ResourceNotFound;
    return c.json(
      fail(error.status === 400 ? 'invalidRequest' : 'fileNotFound', code),
      error.status,
    );
  }
  if (isMissingFile(error)) return c.json(fail('fileNotFound', ErrorCode.ResourceNotFound), 404);
  // Do not log paths or names from the server's private files directory.
  c.get('logger').error('local file operation failed');
  return c.json(fail('internalError', ErrorCode.InternalError), 500);
};

export const listLocalFiles: Handler = async (c) => {
  const parsed = localListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(fail('invalidRequest', ErrorCode.ValidationFailed), 400);
  const { path: relativePath, page, pageSize } = parsed.data;
  try {
    const items = await store.list(relativePath);
    const segments = relativePath ? relativePath.split('/') : [];
    const breadcrumbs = [
      rootBreadcrumb,
      { path: '', name: '本地文件' },
      ...segments.map((name, index) => ({ name, path: segments.slice(0, index + 1).join('/') })),
    ];
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return c.json(
      success<FileDirectory>({
        items: pageItems,
        page,
        pageSize,
        total: items.length,
        path: breadcrumbs,
      }),
    );
  } catch (error) {
    return handleLocalError(c, error);
  }
};

export const readLocalFile: Handler = async (c) => {
  const parsed = localContentQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(fail('invalidRequest', ErrorCode.ValidationFailed), 400);

  try {
    const { file, metadata } = await store.open(parsed.data.path);
    const size = metadata.size;
    const rangeHeader = c.req.header('Range');
    const range = rangeHeader ? parseByteRange(rangeHeader, size) : undefined;
    if (rangeHeader && !range) {
      await file.close();
      return c.body(null, 416, { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' });
    }
    const name = path.basename(parsed.data.path);
    const contentType = lookup(name) || 'application/octet-stream';
    const inline =
      /^(?:video\/|audio\/|image\/(?:jpeg|png|gif|webp|avif|bmp)$|application\/pdf$)/.test(
        contentType,
      );
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(range ? range.end - range.start + 1 : size),
      'Content-Disposition': buildContentDisposition(
        name,
        inline && parsed.data.download !== '1' ? 'inline' : 'attachment',
      ),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Accept-Ranges': 'bytes',
      ...(range ? { 'Content-Range': `bytes ${range.start}-${range.end}/${size}` } : {}),
    };
    if (c.req.method === 'HEAD' || size === 0) {
      await file.close();
      return c.body(null, range ? 206 : 200, headers);
    }
    const stream = file.createReadStream(
      range ? { ...range, autoClose: true } : { autoClose: true },
    );
    const abort = () => stream.destroy();
    c.req.raw.signal.addEventListener('abort', abort, { once: true });
    stream.once('close', () => c.req.raw.signal.removeEventListener('abort', abort));
    if (c.req.raw.signal.aborted) stream.destroy();
    const body = Readable.toWeb(stream) as ReadableStream;
    return c.body(body, range ? 206 : 200, headers);
  } catch (error) {
    return handleLocalError(c, error);
  }
};
