import { ErrorCode } from '@velo/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { fail } from '../../utils/response.js';
import { downloadFileHandler, uploadFileHandler } from './service.js';

const MAX_REQUEST_SIZE = 51 * 1024 * 1024;

export const filesRoute = new Hono();

filesRoute.post(
  '/upload',
  bodyLimit({
    maxSize: MAX_REQUEST_SIZE,
    onError: (c) => c.json(fail('fileTooLarge', ErrorCode.ValidationFailed), 413),
  }),
  uploadFileHandler,
);
filesRoute.get('/:id', downloadFileHandler);
