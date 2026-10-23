import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, rename, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { FileDirectory } from '@velo/shared';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { Hono } from 'hono';
import pino from 'pino';

const originalDirectory = process.cwd();
const originalSecret = process.env.APP_SECRET;
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));
const content = Buffer.from('0123456789abcdef');
let temporaryDirectory: string;
let filesDirectory: string;
let app: Hono;
let adminToken: string;
let userToken: string;
let closeDatabase: () => void;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'velo-files-test-'));
  filesDirectory = path.join(temporaryDirectory, 'data', 'files');
  await mkdir(path.join(filesDirectory, '目录 空格'), { recursive: true });
  await writeFile(path.join(filesDirectory, 'movie.mp4'), content);
  await writeFile(path.join(filesDirectory, 'empty.txt'), '');
  await writeFile(path.join(filesDirectory, '目录 空格', '中文 #100%.txt'), 'nested');
  await writeFile(path.join(temporaryDirectory, 'private.txt'), 'private');
  await symlink(
    path.join(temporaryDirectory, 'private.txt'),
    path.join(filesDirectory, 'link.txt'),
  );
  await symlink(temporaryDirectory, path.join(filesDirectory, 'linked-directory'));
  await symlink(
    path.join(filesDirectory, 'movie.mp4'),
    path.join(filesDirectory, 'internal-link.mp4'),
  );

  process.chdir(temporaryDirectory);
  process.env.APP_SECRET = randomBytes(32).toString('hex');
  const sqlite = new Database(path.join(temporaryDirectory, 'data', 'index.db'));
  migrate(drizzle(sqlite), { migrationsFolder });
  sqlite.close();
  const { api } = await import('../src/routes/index.js');
  const { db } = await import('../src/libs/db/index.js');
  closeDatabase = () => db.$client.close();
  app = new Hono();
  app.use('*', async (c, next) => {
    c.set('logger', pino({ enabled: false }));
    await next();
  });
  app.route('/api', api);

  const register = async (email: string) => {
    const response = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: randomBytes(16).toString('hex') }),
    });
    assert.equal(response.status, 201);
    return (await response.json()).data.token as string;
  };
  adminToken = await register('admin@example.invalid');
  userToken = await register('viewer@example.invalid');
});

after(async () => {
  closeDatabase?.();
  process.chdir(originalDirectory);
  if (originalSecret === undefined) delete process.env.APP_SECRET;
  else process.env.APP_SECRET = originalSecret;
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

const request = (url: string, init: RequestInit = {}, token = adminToken) =>
  app.request(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });

const list = async (relativePath = '', query = '') => {
  const response = await request(
    `/api/files/local?path=${encodeURIComponent(relativePath)}${query}`,
  );
  assert.equal(response.status, 200);
  return (await response.json()).data as FileDirectory;
};

test('the obsolete file roots endpoint is no longer exposed', async () => {
  const response = await request('/api/files');
  assert.equal(response.status, 404);
});

test('missing and empty local roots return an empty list', async () => {
  const backup = `${filesDirectory}-backup`;
  await rename(filesDirectory, backup);
  try {
    assert.deepEqual((await list()).items, []);
    await mkdir(filesDirectory);
    const empty = await list();
    assert.deepEqual(empty.items, []);
    assert.equal(empty.total, 0);
  } finally {
    await rm(filesDirectory, { recursive: true, force: true });
    await rename(backup, filesDirectory);
  }
});

test('lists real files and subdirectories, paginates, and supports Unicode names', async () => {
  const root = await list();
  assert.equal(root.total, 3);
  assert.equal(root.items[0].isDirectory, true);
  assert.deepEqual(
    root.items.map((item) => item.name).sort(),
    ['empty.txt', 'movie.mp4', '目录 空格'].sort(),
  );
  assert.equal(root.items.find((item) => item.name === 'movie.mp4')?.size, content.length);
  const firstPage = await list('', '&pageSize=1');
  const nextPage = await list('', '&page=2&pageSize=1');
  assert.equal(firstPage.items.length, 1);
  assert.equal(nextPage.items.length, 1);
  assert.notEqual(firstPage.items[0].id, nextPage.items[0].id);
  const nested = await list('目录 空格');
  assert.equal(nested.items[0].name, '中文 #100%.txt');
  assert.equal(nested.path.at(-1)?.path, '目录 空格');
  const response = await request(
    `/api/files/local/content?path=${encodeURIComponent(nested.items[0].path)}`,
  );
  assert.equal(await response.text(), 'nested');
});

test('local listings use their relative paths without creating string mappings', async () => {
  const file = (await list('目录 空格')).items[0];
  assert.equal(file.id, file.path);
  assert.equal((await list('目录 空格')).items[0].id, file.id);
  const { db } = await import('../src/libs/db/index.js');
  assert.equal(
    db
      .select()
      .from((await import('../src/modules/string-mapping/schema.js')).stringMappings)
      .all().length,
    0,
  );
});

test('indexed paths are revalidated after deletion or replacement with a symlink', async () => {
  const name = 'temporary-video.mp4';
  const target = path.join(filesDirectory, name);
  await writeFile(target, content);
  const file = (await list()).items.find((entry) => entry.name === name)!;
  const url = `/api/files/local/content?path=${encodeURIComponent(file.path)}`;
  try {
    await rm(target);
    assert.equal((await request(url)).status, 404);
    await symlink(path.join(temporaryDirectory, 'private.txt'), target);
    assert.equal((await request(url)).status, 403);
  } finally {
    await rm(target, { force: true });
  }
});

test('streams complete files, byte ranges, and HEAD without loading full files', async () => {
  const url = '/api/files/local/content?path=movie.mp4';
  const full = await request(url);
  assert.equal(full.status, 200);
  assert.equal(full.headers.get('Content-Type'), 'video/mp4');
  assert.equal(full.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(full.headers.get('Content-Length'), String(content.length));
  assert.equal(full.headers.get('Cache-Control'), 'private, no-store');
  assert.match(full.headers.get('Content-Disposition') ?? '', /^inline/);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), content);

  for (const [range, expected, contentRange] of [
    ['bytes=0-3', '0123', 'bytes 0-3/16'],
    ['bytes=12-', 'cdef', 'bytes 12-15/16'],
    ['bytes=-3', 'def', 'bytes 13-15/16'],
    ['bytes=14-999', 'ef', 'bytes 14-15/16'],
  ]) {
    const response = await request(url, { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), contentRange);
    assert.equal(await response.text(), expected);
  }
  const head = await request(url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('Content-Length'), '16');
  assert.equal(await head.text(), '');
  const empty = await request('/api/files/local/content?path=empty.txt');
  assert.equal(empty.status, 200);
  assert.equal(empty.headers.get('Content-Length'), '0');
  assert.equal(await empty.text(), '');
  const download = await request(`${url}&download=1`);
  assert.match(download.headers.get('Content-Disposition') ?? '', /^attachment/);
  await download.arrayBuffer();
});

test('rejects malformed and unsatisfiable ranges', async () => {
  for (const range of [
    'bytes=99-',
    'bytes=9-1',
    'bytes=-0',
    'bytes=-',
    'bytes=0-1,3-4',
    'items=0-1',
    'bytes=9007199254740992-',
  ]) {
    const response = await request('/api/files/local/content?path=movie.mp4', {
      headers: { Range: range },
    });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('Content-Range'), 'bytes */16');
  }
});

test('blocks traversal, encoded traversal, absolute paths, and invalid pagination', async () => {
  for (const relativePath of [
    '../private.txt',
    '/etc/passwd',
    '目录 空格/../../private.txt',
    '..\\private.txt',
    '%2e%2e/private.txt',
    '%252e%252e/private.txt',
    'movie.mp4\0',
    'a'.repeat(4097),
  ]) {
    const encoded = encodeURIComponent(relativePath);
    assert.equal((await request(`/api/files/local?path=${encoded}`)).status, 400);
    assert.equal((await request(`/api/files/local/content?path=${encoded}`)).status, 400);
  }
  for (const query of ['page=0', 'page=1.5', 'page=NaN', 'pageSize=201', 'pageSize=-1']) {
    assert.equal((await request(`/api/files/local?${query}`)).status, 400);
  }
});

test('does not follow file or directory symlinks, including links inside the root', async () => {
  for (const relativePath of ['link.txt', 'internal-link.mp4', 'linked-directory/private.txt']) {
    assert.equal(
      (await request(`/api/files/local/content?path=${encodeURIComponent(relativePath)}`)).status,
      403,
    );
  }
  assert.equal((await request('/api/files/local?path=linked-directory')).status, 403);
});

test('keeps local files authenticated and permission protected, including media URLs', async () => {
  for (const url of ['/api/files', '/api/files/local', '/api/files/local/content?path=movie.mp4']) {
    assert.equal((await app.request(url)).status, 401);
  }
  assert.equal((await request('/api/files/local', {}, userToken)).status, 403);
  assert.equal(
    (await request('/api/files/local/content?path=movie.mp4', {}, userToken)).status,
    403,
  );
  const response = await app.request(
    `/api/files/local/content?path=movie.mp4&token=${encodeURIComponent(adminToken)}`,
  );
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  assert.equal((await request('/api/files/999999')).status, 404);
});
