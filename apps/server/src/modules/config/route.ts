import { Hono } from 'hono';

import { requirePermission } from '../../middleware/auth.js';
import { deleteConfigHandler, getVersionHandler, setConfigHandler } from './service.js';

export const configRoute = new Hono();

configRoute.get('/version', getVersionHandler);
configRoute.post('/', requirePermission('module:config'), setConfigHandler);
configRoute.delete('/:key', requirePermission('module:config'), deleteConfigHandler);
