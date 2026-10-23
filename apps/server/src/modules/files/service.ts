import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';
import { lookup } from 'mime-types';

import { DATA_DIRECTORY } from '../../libs/db/index.js';
import { fail, success } from '../../utils/response.js';
import { buildContentDisposition } from '../../utils/string.js';
import type { AuthUser } from '../auth/user/service.js';
import {
  createUploadedFile,
  getUploadedAvatarFile,
  getUploadedFileForOwner,
} from './repository.js';

const UPLOAD_DIRECTORY = path.join(DATA_DIRECTORY, 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const STORAGE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:\.[a-z0-9]{1,16})?$/i;

const normalizeFilename = (filename: string): string => {
  const normalized = filename
    .replaceAll('\\', '/')
    .split('/')
    .at(-1)
    // oxlint-disable-next-line no-control-regex -- Remove control characters from uploaded filenames.
    ?.replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 255);
  return normalized || 'upload';
};

const parseFileId = (value: string | undefined): number | undefined => {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

export const uploadFileHandler: Handler = async (c) => {
  let uploaded: unknown;
  try {
    const body = await c.req.parseBody({ all: true });
    if (Object.keys(body).some((key) => key !== 'file') || Array.isArray(body.file)) {
      return c.json(fail('invalidRequest', ErrorCode.InvalidRequest), 400);
    }
    uploaded = body.file;
  } catch {
    return c.json(fail('invalidRequest', ErrorCode.InvalidRequest), 400);
  }

  if (!(uploaded instanceof File) || uploaded.size <= 0) {
    return c.json(fail('fileRequired', ErrorCode.ValidationFailed), 400);
  }
  if (uploaded.size > MAX_FILE_SIZE) {
    return c.json(fail('fileTooLarge', ErrorCode.ValidationFailed), 413);
  }

  const user = c.get('authUser') as AuthUser;
  const originalName = normalizeFilename(uploaded.name);
  const extension = path.extname(originalName);
  const safeExtension = /^\.[a-z0-9]{1,16}$/i.test(extension) ? extension : '';
  const storageKey = `${randomUUID()}${safeExtension}`;
  const storagePath = path.join(UPLOAD_DIRECTORY, storageKey);
  const contentType = lookup(originalName) || 'application/octet-stream';

  try {
    await mkdir(UPLOAD_DIRECTORY, { recursive: true, mode: 0o700 });
    await chmod(UPLOAD_DIRECTORY, 0o700);
    await pipeline(
      Readable.from(uploaded.stream()),
      createWriteStream(storagePath, { flags: 'wx', mode: 0o600 }),
    );

    const saved = createUploadedFile({
      storageKey,
      originalName,
      contentType,
      sizeBytes: uploaded.size,
      uploaderId: user.id,
    });

    return c.json(
      success({
        ...saved,
        downloadUrl: `/api/files/${saved.id}`,
      }),
      201,
    );
  } catch (error) {
    await rm(storagePath, { force: true }).catch(() => undefined);
    c.get('logger').error({ err: error }, 'file upload failed');
    return c.json(fail('internalError', ErrorCode.InternalError), 500);
  }
};

export const downloadFileHandler: Handler = async (c) => {
  const id = parseFileId(c.req.param('id'));
  if (!id) return c.json(fail('invalidFileId', ErrorCode.ValidationFailed), 400);

  const user = c.get('authUser') as AuthUser;
  const ownedFile = getUploadedFileForOwner(id, user.id);
  const avatarFile =
    !ownedFile && c.get('permissions').has('admin') ? getUploadedAvatarFile(id) : undefined;
  const file = ownedFile ?? avatarFile;
  if (!file) return c.json(fail('fileNotFound', ErrorCode.ResourceNotFound), 404);
  if (avatarFile && !avatarFile.contentType.startsWith('image/')) {
    return c.json(fail('fileNotFound', ErrorCode.ResourceNotFound), 404);
  }
  if (!STORAGE_KEY_PATTERN.test(file.storageKey)) {
    c.get('logger').error('stored file has invalid storage key');
    return c.json(fail('internalError', ErrorCode.InternalError), 500);
  }

  const storagePath = path.join(UPLOAD_DIRECTORY, file.storageKey);
  try {
    const metadata = await lstat(storagePath);
    if (!metadata.isFile()) {
      return c.json(fail('fileNotFound', ErrorCode.ResourceNotFound), 404);
    }
  } catch {
    return c.json(fail('fileNotFound', ErrorCode.ResourceNotFound), 404);
  }

  const body = Readable.toWeb(createReadStream(storagePath)) as unknown as ReadableStream;

  return c.body(body, 200, {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': buildContentDisposition(file.originalName, 'attachment'),
    'Content-Length': String(file.sizeBytes),
    'Content-Type': file.contentType,
    'X-Content-Type-Options': 'nosniff',
  });
};
