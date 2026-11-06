import mime from 'mime-types';

import { secret } from './crypto.js';
import {
  qrLoginResponseSchema,
  qrStatusResponseSchema,
  qrTokenResponseSchema,
  userInfoResponseSchema,
} from './types.js';
import type {
  DownloadMetaResponse,
  FileInfo,
  FileListResponse,
  FileResponse,
  QrLoginToken,
  RequestOptions,
} from './types.js';

const FILE_LIST_URL = 'https://webapi.115.com/files';
const DOWNLOAD_URL = 'https://proapi.115.com/app/chrome/downurl';
const QR_TOKEN_URL = 'https://qrcodeapi.115.com/api/1.0/web/1.0/token/';
const QR_STATUS_URL = 'https://qrcodeapi.115.com/get/status/';
const QR_IMAGE_URL = 'https://qrcodeapi.115.com/api/1.0/web/1.0/qrcode';
const QR_LOGIN_URL = 'https://passportapi.115.com/app/1.0/ios/1.0/login/qrcode';
const USER_INFO_URL = 'https://my.115.com/';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX_QR_IMAGE_BYTES = 256 * 1024;
const QR_STATUS_TIMEOUT_MS = 30_000;

export class Pan115Sdk {
  readonly userAgent: string;
  private readonly cookie: string;

  constructor(cookie: string, userAgent?: string) {
    this.userAgent = userAgent?.trim() || DEFAULT_USER_AGENT;
    this.cookie = cookie;
  }

  private async request(
    input: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.delete('Cookie');
    headers.set('Accept', options.accept ?? 'application/json');
    headers.set('User-Agent', this.userAgent);
    if (options.withCookie) headers.set('Cookie', this.cookie);

    const signal = options.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : init.signal;
    const response = await fetch(input, {
      ...init,
      headers,
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) throw new Error(`115 request failed: ${response.status}`);
    return response;
  }

  async getQrCode(): Promise<{ token: QrLoginToken; imageDataUrl: string }> {
    const rawToken: unknown = await (
      await this.request(QR_TOKEN_URL, {}, { timeoutMs: 10_000 })
    ).json();
    const tokenResponse = qrTokenResponseSchema.parse(rawToken);
    if (tokenResponse.state === false || tokenResponse.state === 0) {
      throw new Error('115 QR token request failed');
    }

    const token = tokenResponse.data;
    const imageUrl = new URL(QR_IMAGE_URL);
    imageUrl.searchParams.set('uid', token.uid);
    const imageResponse = await this.request(
      imageUrl.toString(),
      {},
      { timeoutMs: 10_000, accept: 'image/png' },
    );
    const contentType = imageResponse.headers.get('content-type')?.split(';')[0];
    if (!imageResponse.ok || contentType !== 'image/png' || !imageResponse.body) {
      throw new Error('115 QR image request failed');
    }

    const reader = imageResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_QR_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error('115 QR image exceeded the size limit');
      }
      chunks.push(value);
    }
    if (totalBytes === 0) throw new Error('115 QR image is empty');

    return {
      token,
      imageDataUrl: `data:image/png;base64,${Buffer.concat(chunks).toString('base64')}`,
    };
  }

  async getQrStatus(token: QrLoginToken): Promise<number> {
    const statusUrl = new URL(QR_STATUS_URL);
    statusUrl.search = new URLSearchParams({
      uid: token.uid,
      time: String(token.time),
      sign: token.sign,
    }).toString();
    const rawStatus: unknown = await (
      await this.request(statusUrl.toString(), {}, { timeoutMs: QR_STATUS_TIMEOUT_MS })
    ).json();
    const statusResponse = qrStatusResponseSchema.parse(rawStatus);
    if (statusResponse.state === false || statusResponse.state === 0) {
      throw new Error('115 QR status request failed');
    }
    return statusResponse.data.status;
  }

  async loginWithQrCode(uid: string): Promise<string> {
    const body = new FormData();
    body.set('account', uid);
    body.set('app', 'ios');
    const rawResult: unknown = await (
      await this.request(QR_LOGIN_URL, { method: 'POST', body }, { timeoutMs: 10_000 })
    ).json();
    const loginResponse = qrLoginResponseSchema.parse(rawResult);
    if (loginResponse.state === false || loginResponse.state === 0) {
      throw new Error('115 QR login failed');
    }

    const entries = Object.entries(loginResponse.data.cookie);
    if (
      entries.length === 0 ||
      entries.some(
        ([name, value]) => !/^[A-Za-z0-9_-]{1,64}$/.test(name) || /[;\r\n]/.test(String(value)),
      )
    ) {
      throw new Error('115 QR login returned invalid cookies');
    }

    return entries.map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async getUserInfo(): Promise<{ userName: string; avatarUrl: string | null } | null> {
    const url = new URL(USER_INFO_URL);
    url.searchParams.set('ct', 'ajax');
    url.searchParams.set('ac', 'nav');
    url.searchParams.set('_', String(Math.floor(Date.now() / 1000)));
    const response = await this.request(
      url.toString(),
      { method: 'GET' },
      { withCookie: true, timeoutMs: 10_000 },
    );
    const profileResponse = userInfoResponseSchema.parse(await response.json());
    if (profileResponse.state === false || profileResponse.state === 0) return null;

    const profile = profileResponse.data;
    if (!profile) return null;

    let avatarUrl: string | null = null;
    if (profile.face) {
      try {
        const candidate = new URL(profile.face, USER_INFO_URL);
        if (
          candidate.protocol === 'https:' &&
          (candidate.hostname === '115.com' || candidate.hostname.endsWith('.115.com'))
        ) {
          avatarUrl = candidate.toString();
        }
      } catch {
        avatarUrl = null;
      }
    }

    return {
      userName: profile.user_name?.trim() || '115 用户',
      avatarUrl,
    };
  }

  async getFileList(offset = 0, pageSize = 100, cid = '0'): Promise<FileListResponse> {
    const query = new URLSearchParams({
      aid: '1',
      cid,
      o: 'user_ptime',
      asc: '1',
      offset: String(offset),
      show_dir: '1',
      limit: String(pageSize),
      snap: '0',
      natsort: '0',
      record_open_time: '1',
      format: 'json',
      fc_mix: '0',
    });
    const response = await this.request(
      `${FILE_LIST_URL}?${query.toString()}`,
      { method: 'GET' },
      { withCookie: true },
    );
    return (await response.json()) as FileListResponse;
  }

  async getFile(pc: string): Promise<FileInfo> {
    const timestamp = Math.floor(Date.now() / 1000);
    const encoded = secret.encode(JSON.stringify({ pickcode: pc }), timestamp);
    const body = new FormData();
    body.append('data', encoded.data);
    const response = (await (
      await this.request(DOWNLOAD_URL, { method: 'POST', body }, { withCookie: true })
    ).json()) as FileResponse;
    if (!response.state || !response.data) {
      throw new Error(
        `115 returned no download metadata (msg=${response.msg}, errno=${response.errno})`,
      );
    }
    let decoded: string;
    try {
      decoded = secret.decode(response.data, encoded.key);
    } catch {
      throw new Error('115 download metadata could not be decoded');
    }
    try {
      const meta = JSON.parse(decoded) as DownloadMetaResponse;
      const entry = Object.values(meta)[0];
      return {
        file_name: entry.file_name,
        file_size: entry.file_size,
        url: entry.url.url,
        mime: mime.lookup(entry.file_name) || 'application/octet-stream',
      };
    } catch {
      throw new Error('115 download metadata is invalid');
    }
  }
}
