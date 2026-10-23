import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import type * as MappingService from '../src/modules/string-mapping/service.js';

const originalDirectory = process.cwd();
const serviceUrl = new URL('../src/modules/string-mapping/service.ts', import.meta.url);
const databaseUrl = new URL('../src/libs/db/index.ts', import.meta.url);
let temporaryDirectory: string;
let service: typeof MappingService;
let closeDatabase: () => void;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'velo-string-mapping-'));
  await mkdir(path.join(temporaryDirectory, 'data'));
  const sqlite = new Database(path.join(temporaryDirectory, 'data/index.db'));
  migrate(drizzle(sqlite), {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  sqlite.close();
  process.chdir(temporaryDirectory);
  service = await import('../src/modules/string-mapping/service.js');
  const { db } = await import('../src/libs/db/index.js');
  closeDatabase = () => db.$client.close();
});

after(async () => {
  mock.restoreAll();
  closeDatabase?.();
  process.chdir(originalDirectory);
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

test('retries collisions and never overwrites another string, even across namespaces', () => {
  const randomInt = mock.method(crypto, 'randomInt', () => 0);
  try {
    const first = service.getOrCreateStringId('first', '原字符串');
    assert.equal(first, 'aaaaaa');
    let calls = 0;
    randomInt.mock.mockImplementation(() => (calls++ < 6 ? 0 : 1));
    const second = service.getOrCreateStringId('second', '原字符串');
    assert.equal(second, 'bbbbbb');
    assert.equal(service.resolveStringId('first', first), '原字符串');
    assert.equal(service.resolveStringId('second', second), '原字符串');
    assert.equal(service.resolveStringId('second', first), undefined);

    randomInt.mock.mockImplementation(() => 0);
    assert.throws(() => service.getOrCreateStringId('third', 'different'), /Unable to allocate/);
    assert.equal(service.resolveStringId('first', first), '原字符串');
  } finally {
    mock.restoreAll();
  }
});

test('maps arbitrary strings to stable six-character lowercase alphanumeric IDs', () => {
  const values = ['', '目录/视频 #100%.mp4', 'https://example.invalid/?a=1&b=2', 'same', 'Same'];
  const ids = new Set<string>();
  for (const value of [...values, ...Array.from({ length: 128 }, (_, index) => String(index))]) {
    const id = service.getOrCreateStringId('test', value);
    assert.match(id, /^[a-z0-9]{6}$/);
    assert.equal(ids.has(id), false);
    ids.add(id);
    assert.equal(service.getOrCreateStringId('test', value), id);
    assert.equal(service.resolveStringId('test', id), value);
  }
  assert.equal(service.resolveStringId('test', 'aaaaaa'), undefined);
  for (const id of ['', 'ABC123', 'ab_c12', 'ab-c12', '12345', '1234567']) {
    assert.equal(service.resolveStringId('test', id), undefined);
  }
});

test('bounds inputs without trimming or changing the original string', () => {
  for (const namespace of ['', '../invalid', 'Uppercase', 'a'.repeat(65)]) {
    assert.throws(() => service.getOrCreateStringId(namespace, 'value'));
    assert.throws(() => service.resolveStringId(namespace, 'aaaaaa'));
  }
  assert.throws(() => service.getOrCreateStringId('test', 'a'.repeat(16385)));
  const value = '  spaced string\n';
  assert.equal(service.resolveStringId('test', service.getOrCreateStringId('test', value)), value);
});

test('persists and reuses a mapping when multiple processes create the same string', async () => {
  const run = () =>
    promisify(execFile)(
      process.execPath,
      [
        '--import',
        import.meta.resolve('tsx'),
        '--input-type=module',
        '-e',
        `const { getOrCreateStringId } = await import(${JSON.stringify(serviceUrl.href)});
     const { db } = await import(${JSON.stringify(databaseUrl.href)});
     process.stdout.write(getOrCreateStringId('concurrent', 'shared value'));
     db.$client.close();`,
      ],
      { cwd: temporaryDirectory },
    );
  const results = await Promise.all([run(), run(), run()]);
  const id = results[0].stdout;
  assert.match(id, /^[a-z0-9]{6}$/);
  assert.ok(results.every((result) => result.stdout === id));
  assert.equal(service.getOrCreateStringId('concurrent', 'shared value'), id);
  assert.equal(service.resolveStringId('concurrent', id), 'shared value');
});
