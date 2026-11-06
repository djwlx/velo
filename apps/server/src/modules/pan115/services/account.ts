import { randomUUID } from 'node:crypto';

import { ErrorCode } from '@velo/shared';
import type { Handler } from 'hono';
import { z } from 'zod';

import { encrypt } from '../../../libs/crypto.js';
import { Pan115Sdk } from '../../../libs/pan115/index.js';
import { fail, success } from '../../../utils/response.js';
import { setConfig, deleteConfig } from '../../config/repository.js';
import { getConfigValue } from '../../config/service.js';
import { ConfigKey } from '../../config/types.js';
import type { Pan115Env } from '../types.js';

const QR_SESSION_TTL_MS = 10 * 60 * 1000;
const sessionIdSchema = z.string().uuid();

type QrLoginSession = {
  token: { uid: string; time: number; sign: string };
  expiresAt: number;
  status: 'waiting' | 'scanned';
  processing: boolean;
};

const qrLoginSessions = new Map<string, QrLoginSession>();
let qrLoginStartInProgress = false;

function pruneExpiredSessions(now: number): void {
  for (const [id, session] of qrLoginSessions) {
    if (session.expiresAt <= now) qrLoginSessions.delete(id);
  }
}

function preventCaching(c: Parameters<Handler<Pan115Env>>[0]): void {
  c.header('Cache-Control', 'no-store');
  c.header('Pragma', 'no-cache');
}

export const get115AccountStatus: Handler<Pan115Env> = (c) => {
  preventCaching(c);
  const cookie = getConfigValue(ConfigKey.cookie115);
  if (!cookie) return c.json(success({ bound: false, profile: null, profileAvailable: true }));

  return new Pan115Sdk(cookie)
    .getUserInfo()
    .then((profile) =>
      c.json(success({ bound: true, profile, profileAvailable: profile !== null })),
    )
    .catch(() => {
      c.get('logger').warn('115 account profile lookup failed');
      return c.json(success({ bound: true, profile: null, profileAvailable: false }));
    });
};

export const start115QrLogin: Handler<Pan115Env> = async (c) => {
  preventCaching(c);
  const now = Date.now();
  pruneExpiredSessions(now);
  if (qrLoginStartInProgress) {
    return c.json(fail('qrLoginSessionLimit', ErrorCode.ResourceConflict), 409);
  }

  qrLoginStartInProgress = true;
  try {
    const qr = await new Pan115Sdk('').getQrCode();
    const sessionId = randomUUID();
    const expiresAt = Date.now() + QR_SESSION_TTL_MS;
    qrLoginSessions.clear();
    qrLoginSessions.set(sessionId, {
      token: qr.token,
      expiresAt,
      status: 'waiting',
      processing: false,
    });
    c.get('logger').info('115 account QR login started');
    return c.json(success({ sessionId, imageDataUrl: qr.imageDataUrl, expiresAt }), 201);
  } catch {
    c.get('logger').error('115 account QR initialization failed');
    return c.json(fail('qrLoginUnavailable', ErrorCode.ExternalServiceFailed), 502);
  } finally {
    qrLoginStartInProgress = false;
  }
};

export const poll115QrLogin: Handler<Pan115Env> = async (c) => {
  preventCaching(c);
  const parsedSessionId = sessionIdSchema.safeParse(c.req.param('sessionId'));
  if (!parsedSessionId.success) {
    return c.json(fail('invalidQrLoginSession', ErrorCode.ValidationFailed), 400);
  }

  const sessionId = parsedSessionId.data;
  const session = qrLoginSessions.get(sessionId);
  const now = Date.now();
  if (!session || session.expiresAt <= now) {
    qrLoginSessions.delete(sessionId);
    return c.json(success({ status: 'expired' as const }));
  }
  if (session.processing) {
    return c.json(success({ status: session.status }));
  }

  session.processing = true;
  try {
    const sdk = new Pan115Sdk('');
    const status = await sdk.getQrStatus(session.token);
    if (session.expiresAt <= Date.now()) {
      qrLoginSessions.delete(sessionId);
      return c.json(success({ status: 'expired' as const }));
    }
    if (status === 1) {
      session.status = 'scanned';
      return c.json(success({ status: session.status }));
    }
    if (status === 2) {
      const cookie = await sdk.loginWithQrCode(session.token.uid);
      setConfig(ConfigKey.cookie115, encrypt(cookie));
      qrLoginSessions.delete(sessionId);
      c.get('logger').info('115 account QR login completed');
      return c.json(success({ status: 'authorized' as const }));
    }
    if (status !== 0) {
      qrLoginSessions.delete(sessionId);
      return c.json(success({ status: 'expired' as const }));
    }

    return c.json(success({ status: 'waiting' as const }));
  } catch {
    qrLoginSessions.delete(sessionId);
    c.get('logger').error('115 account QR login failed');
    return c.json(success({ status: 'failed' as const }));
  } finally {
    session.processing = false;
  }
};

export const remove115Account: Handler<Pan115Env> = (c) => {
  preventCaching(c);
  qrLoginSessions.clear();
  deleteConfig(ConfigKey.cookie115);
  c.get('logger').info('115 account disconnected');
  return c.json(success({ bound: false }));
};
