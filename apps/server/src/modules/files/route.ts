import { ErrorCode } from '@velo/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { requirePermission } from '../../middleware/auth.js';
import { fail } from '../../utils/response.js';
import { listLocalFiles, readLocalFile } from './local/service.js';
import { downloadFileHandler, uploadFileHandler } from './service.js';

const MAX_REQUEST_SIZE = 51 * 1024 * 1024;

export const filesRoute = new Hono();

filesRoute.get('/local', requirePermission('file:read'), listLocalFiles);
filesRoute.on(['GET', 'HEAD'], '/local/content', requirePermission('file:read'), readLocalFile);

filesRoute.post(
  '/upload',
  requirePermission('file:write'),
  bodyLimit({
    maxSize: MAX_REQUEST_SIZE,
    onError: (c) => c.json(fail('fileTooLarge', ErrorCode.ValidationFailed), 413),
  }),
  uploadFileHandler,
);
filesRoute.get('/:id', downloadFileHandler);
