import { Hono } from 'hono';

import { requirePermission } from '../../../middleware/auth.js';
import { getPermissionHandler, listPermissionsHandler } from './service.js';

export const permissionRoute = new Hono();

permissionRoute.use('*', requirePermission('admin'));

permissionRoute.get('/', listPermissionsHandler);
permissionRoute.get('/:code', getPermissionHandler);
