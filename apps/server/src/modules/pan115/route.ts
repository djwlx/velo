import { Hono } from 'hono';

import { requirePermission } from '../../middleware/auth.js';
import { injectCookie } from './middleware/cookie.js';
import {
  get115AccountStatus,
  poll115QrLogin,
  remove115Account,
  start115QrLogin,
} from './services/account.js';
import { getFile, getFiles } from './services/files.js';
import { cacheFileIdInDB, clearPicsHandler, getRandomPic } from './services/pic.js';
import type { Pan115Env } from './types.js';

export const pan115Route = new Hono<Pan115Env>();

const accountRoute = new Hono<Pan115Env>();
accountRoute.use('*', requirePermission('admin'));
accountRoute.get('/', get115AccountStatus);
accountRoute.post('/login/qr', start115QrLogin);
accountRoute.get('/login/qr/:sessionId', poll115QrLogin);
accountRoute.delete('/', remove115Account);

pan115Route.route('/account', accountRoute);
pan115Route.use(injectCookie);

pan115Route.get('/pic/random', getRandomPic);

pan115Route.use('*', requirePermission('admin'));

pan115Route.get('/files/:cid', getFiles);
pan115Route.get('/file/:pickCode', getFile);
pan115Route.post('/pic/cache', cacheFileIdInDB);
pan115Route.delete('/pic', clearPicsHandler);
