import { ErrorCode } from '@velo/shared';
import type { MiddlewareHandler } from 'hono';

import type { Permission } from '../config/permissions.js';
import { PUBLIC_API_PATHS } from '../config/public-routes.js';
import { verifyAccessToken } from '../libs/jwt.js';
import { getUserPermissions } from '../modules/auth/permission/repository.js';
import { getActiveUser } from '../modules/auth/user/repository.js';
import { fail } from '../utils/response.js';

const publicApiPaths = new Set<string>(PUBLIC_API_PATHS);

const JWT_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  if (publicApiPaths.has(c.req.path)) return next();

  const authorization = c.req.header('Authorization') ?? '';
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(authorization);
  let token = match?.[1];
  if (!token && c.req.method === 'GET') {
    const queryToken = c.req.query('token');
    token = queryToken && JWT_TOKEN_PATTERN.test(queryToken) ? queryToken : undefined;
  }
  const tokenUser = token ? verifyAccessToken(token) : undefined;
  const user = tokenUser ? getActiveUser(tokenUser.id) : undefined;
  if (!user) return c.json(fail('authenticationRequired', ErrorCode.AuthenticationRequired), 401);

  c.set('authUser', user);
  c.set('permissions', getUserPermissions(user.id));
  return next();
};

export const requirePermission =
  (...permissions: [Permission, ...Permission[]]): MiddlewareHandler =>
  async (c, next) => {
    const userPermissions = c.get('permissions');
    if (permissions.some((permission) => !userPermissions.has(permission))) {
      return c.json(fail('permissionDenied', ErrorCode.PermissionDenied), 403);
    }
    await next();
  };
