import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createCipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { readAppSecret } from '../src/config/app-secret.js';
import { loadAppMigrations } from '../src/migrations/index.js';
import { runAppMigrations } from '../src/migrations/runner.js';
import { initializeServer } from '../src/startup.js';

const directories: string[] = [];
const bootstrapPath = fileURLToPath(new URL('../src/bootstrap.ts', import.meta.url));
const tsx = import.meta.resolve('tsx');

function installation(): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'velo-startup-'));
  directories.push(directory);
  mkdirSync(path.join(directory, 'data'), { mode: 0o700 });
  return directory;
}

function withDatabase<T>(directory: string, run: (sqlite: Database.Database) => T): T {
  const sqlite = new Database(path.join(directory, 'data/index.db'));
  try {
    return run(sqlite);
  } finally {
    sqlite.close();
  }
}

function prepareSchema(directory: string): void {
  withDatabase(directory, (sqlite) => {
    migrate(drizzle(sqlite), {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });
  });
}

function seedCompletedMigration(directory: string): void {
  prepareSchema(directory);
  withDatabase(directory, (sqlite) => {
    sqlite
      .prepare('INSERT INTO velo_app_migrations (id, checksum, applied_at) VALUES (?, ?, ?)')
      .run(
        '0001-persist-app-secret',
        'da0b0b0050b14ada5a68154d762c35e8a238152111464bb02883616285114e7d',
        0,
      );
  });
}

function recordCount(directory: string): number {
  return withDatabase(
    directory,
    (sqlite) =>
      (
        sqlite.prepare('SELECT count(*) AS count FROM velo_app_migrations').get() as {
          count: number;
        }
      ).count,
  );
}

function keyPath(directory: string): string {
  return path.join(directory, 'data/app-secret');
}

after(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});

test('fresh startup initializes one private key and skips completed migrations on subsequent starts', () => {
  const directory = installation();
  const first = initializeServer({ workingDirectory: directory });
  const secret = readAppSecret(path.join(directory, 'data'));
  assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(first.appliedMigrations, [
    '0001-persist-app-secret',
    '0002-initialize-app-secret',
  ]);
  assert.equal(recordCount(directory), 2);
  if (process.platform !== 'win32') assert.equal(statSync(keyPath(directory)).mode & 0o777, 0o600);
  for (const folder of ['uploads', 'files', 'logs'])
    assert.ok(statSync(path.join(directory, 'data', folder)).isDirectory());
  const before = statSync(keyPath(directory));
  assert.deepEqual(initializeServer({ workingDirectory: directory }).appliedMigrations, []);
  assert.equal(readAppSecret(path.join(directory, 'data')), secret);
  assert.equal(statSync(keyPath(directory)).ino, before.ino);
  assert.equal(statSync(keyPath(directory)).mtimeMs, before.mtimeMs);
});

test('environment variables and both env files are ignored even on a fresh installation', () => {
  const original = process.env.APP_SECRET;
  try {
    process.env.APP_SECRET = 'ignored-environment-value';
    const directory = installation();
    writeFileSync(path.join(directory, '.env'), 'APP_SECRET=ignored-env-file');
    writeFileSync(path.join(directory, 'data/.env'), 'APP_SECRET=ignored-data-env-file');
    initializeServer({ workingDirectory: directory });
    const secret = readAppSecret(path.join(directory, 'data'));
    assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(readFileSync(path.join(directory, '.env'), 'utf8'), 'APP_SECRET=ignored-env-file');
    process.env.APP_SECRET = 'another-ignored-value';
    assert.deepEqual(initializeServer({ workingDirectory: directory }).appliedMigrations, []);
    assert.equal(readAppSecret(path.join(directory, 'data')), secret);
  } finally {
    if (original === undefined) delete process.env.APP_SECRET;
    else process.env.APP_SECRET = original;
  }
});

test('already migrated data retains its exact key, encrypted Cookie and signed login tokens', async () => {
  const directory = installation();
  seedCompletedMigration(directory);
  const secret = '\uFEFF  synthetic persisted key\nwith newline  ';
  writeFileSync(keyPath(directory), secret, { mode: 0o600 });
  const before = statSync(keyPath(directory));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update('synthetic-cookie', 'utf8'), cipher.final()]);
  const value = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  withDatabase(directory, (sqlite) => {
    sqlite
      .prepare('INSERT INTO velo_config (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run('cookie115', value, 0, 0);
  });
  assert.deepEqual(initializeServer({ workingDirectory: directory }).appliedMigrations, [
    '0002-initialize-app-secret',
  ]);
  assert.equal(readAppSecret(path.join(directory, 'data')), secret);
  assert.equal(statSync(keyPath(directory)).ino, before.ino);
  assert.equal(statSync(keyPath(directory)).mtimeMs, before.mtimeMs);
  assert.equal(recordCount(directory), 2);

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: '1', email: 'synthetic@example.invalid' }),
  ).toString('base64url');
  const content = `${header}.${payload}`;
  const token = `${content}.${createHmac('sha256', secret).update(content).digest('base64url')}`;
  const cryptoUrl = new URL('../src/libs/crypto.ts', import.meta.url).href;
  const jwtUrl = new URL('../src/libs/jwt.ts', import.meta.url).href;
  const result = await promisify(execFile)(
    process.execPath,
    [
      '--import',
      tsx,
      '--input-type=module',
      '-e',
      `import assert from 'node:assert/strict';
     const { decrypt } = await import(${JSON.stringify(cryptoUrl)});
     const { verifyAccessToken } = await import(${JSON.stringify(jwtUrl)});
     assert.equal(decrypt(${JSON.stringify(value)}), 'synthetic-cookie');
     assert.equal(verifyAccessToken(${JSON.stringify(token)})?.id, 1);
     process.stdout.write('compatible');`,
    ],
    { cwd: directory, env: { ...process.env, APP_SECRET: 'ignored-external-value' } },
  );
  assert.equal(result.stdout, 'compatible');
});

test('a missing key from a completed migration is never regenerated, even with an external key', () => {
  const directory = installation();
  seedCompletedMigration(directory);
  assert.throws(() => initializeServer({ workingDirectory: directory }), /restore it from backup/);
  assert.equal(existsSync(keyPath(directory)), false);
  assert.equal(recordCount(directory), 1);
});

test('existing users or config without a key cannot be treated as a fresh installation', () => {
  for (const kind of ['user', 'config']) {
    const directory = installation();
    prepareSchema(directory);
    withDatabase(directory, (sqlite) => {
      if (kind === 'user')
        sqlite
          .prepare(
            'INSERT INTO velo_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
          )
          .run('synthetic@example.invalid', 'synthetic-hash', 0, 0);
      else
        sqlite
          .prepare(
            'INSERT INTO velo_config (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
          )
          .run('cookie115', 'synthetic-config', 0, 0);
    });
    assert.throws(
      () => initializeServer({ workingDirectory: directory }),
      /Restore it from backup/,
    );
    assert.equal(existsSync(keyPath(directory)), false);
    assert.equal(recordCount(directory), 0);
  }
});

test('missing, empty, oversized and invalid UTF-8 keys stop startup without replacement', () => {
  const directory = installation();
  initializeServer({ workingDirectory: directory });
  for (const value of [undefined, '', 'a'.repeat(4097), Buffer.from([0xff])]) {
    if (value === undefined) unlinkSync(keyPath(directory));
    else writeFileSync(keyPath(directory), value);
    assert.throws(() => initializeServer({ workingDirectory: directory }), /app-secret/);
    assert.equal(recordCount(directory), 2);
    if (value === undefined) assert.equal(existsSync(keyPath(directory)), false);
  }
});

test(
  'persisted key permissions are corrected without changing its contents',
  { skip: process.platform === 'win32' },
  () => {
    const directory = installation();
    initializeServer({ workingDirectory: directory });
    const secret = readFileSync(keyPath(directory), 'utf8');
    chmodSync(keyPath(directory), 0o644);
    assert.equal(readAppSecret(path.join(directory, 'data')), secret);
    assert.equal(statSync(keyPath(directory)).mode & 0o777, 0o600);
  },
);

test(
  'linked keys are rejected without changing their targets',
  { skip: process.platform === 'win32' },
  () => {
    for (const kind of ['symlink', 'hardlink']) {
      const directory = installation();
      const target = path.join(directory, 'outside-secret');
      writeFileSync(target, 'outside-content', { mode: 0o644 });
      if (kind === 'symlink') symlinkSync(target, keyPath(directory));
      else linkSync(target, keyPath(directory));
      assert.throws(
        () => initializeServer({ workingDirectory: directory }),
        /symbolic links|private file/,
      );
      assert.equal(readFileSync(target, 'utf8'), 'outside-content');
      assert.equal(statSync(target).mode & 0o777, 0o644);
      assert.equal(recordCount(directory), 0);
    }
  },
);

test(
  'only the files root can map to an external directory',
  { skip: process.platform === 'win32' },
  () => {
    const target = installation();
    const external = path.join(target, 'data');
    chmodSync(external, 0o750);
    writeFileSync(path.join(external, 'keep.txt'), 'unchanged');
    const directory = installation();
    symlinkSync(external, path.join(directory, 'data/files'));
    initializeServer({ workingDirectory: directory });
    assert.equal(statSync(external).mode & 0o777, 0o750);
    assert.equal(readFileSync(path.join(external, 'keep.txt'), 'utf8'), 'unchanged');
    for (const folder of ['uploads', 'logs']) {
      const other = installation();
      symlinkSync(external, path.join(other, 'data', folder));
      assert.throws(
        () => initializeServer({ workingDirectory: other }),
        /only files may be a symbolic link/,
      );
    }
    const linked = installation();
    rmSync(path.join(linked, 'data'), { recursive: true });
    symlinkSync(external, path.join(linked, 'data'));
    assert.throws(() => initializeServer({ workingDirectory: linked }), /without symbolic links/);
  },
);

test('an interruption after publishing a key retries without regenerating it', () => {
  const directory = installation();
  prepareSchema(directory);
  withDatabase(directory, (sqlite) => {
    const [baseline, migration] = loadAppMigrations();
    assert.throws(
      () =>
        runAppMigrations({ sqlite, dataDirectory: path.join(directory, 'data') }, [
          baseline,
          {
            ...migration,
            up(context) {
              migration.up(context);
              throw new Error('synthetic-sensitive-error');
            },
          },
        ]),
      (error: Error) => {
        assert.doesNotMatch(error.message, /synthetic-sensitive-error/);
        return /0002-initialize-app-secret failed/.test(error.message);
      },
    );
  });
  assert.equal(recordCount(directory), 0);
  const secret = readFileSync(keyPath(directory), 'utf8');
  const inode = statSync(keyPath(directory)).ino;
  initializeServer({ workingDirectory: directory });
  assert.equal(readAppSecret(path.join(directory, 'data')), secret);
  assert.equal(statSync(keyPath(directory)).ino, inode);
  assert.equal(recordCount(directory), 2);
});

test('an interrupted temporary write is discarded before initializing a complete key', () => {
  const directory = installation();
  const temporary = path.join(directory, 'data/app-secret.tmp');
  writeFileSync(temporary, 'partial');
  initializeServer({ workingDirectory: directory });
  assert.match(readAppSecret(path.join(directory, 'data')), /^[A-Za-z0-9_-]{43}$/);
  assert.equal(existsSync(temporary), false);
});

test('failed migrations roll back pending database changes and completion records', () => {
  const directory = installation();
  initializeServer({ workingDirectory: directory });
  withDatabase(directory, (sqlite) => {
    assert.throws(
      () =>
        runAppMigrations({ sqlite, dataDirectory: path.join(directory, 'data') }, [
          ...loadAppMigrations(),
          {
            id: '0003-synthetic-write',
            checksum: 'a'.repeat(64),
            up() {
              sqlite
                .prepare(
                  'INSERT INTO velo_config (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
                )
                .run('probe', 'probe', 0, 0);
            },
          },
          {
            id: '0004-synthetic-failure',
            checksum: 'b'.repeat(64),
            up() {
              throw new Error('synthetic failure');
            },
          },
        ]),
      /0004-synthetic-failure failed/,
    );
    assert.equal(sqlite.prepare('SELECT 1 FROM velo_config WHERE key = ?').get('probe'), undefined);
  });
  assert.equal(recordCount(directory), 2);
});

test('edited and unknown completed migrations are rejected without changing the key', () => {
  for (const kind of ['changed', 'unknown']) {
    const directory = installation();
    initializeServer({ workingDirectory: directory });
    const secret = readFileSync(keyPath(directory), 'utf8');
    withDatabase(directory, (sqlite) => {
      if (kind === 'changed')
        sqlite.prepare('UPDATE velo_app_migrations SET checksum = ?').run('0'.repeat(64));
      else
        sqlite
          .prepare('INSERT INTO velo_app_migrations (id, checksum, applied_at) VALUES (?, ?, ?)')
          .run('9999-unknown', '0'.repeat(64), 0);
    });
    assert.throws(
      () => initializeServer({ workingDirectory: directory }),
      /history does not match/,
    );
    assert.equal(readFileSync(keyPath(directory), 'utf8'), secret);
  }
});

test('CLI ignores external secrets and fails before serving if the persisted key is missing', async () => {
  const directory = installation();
  const run = (args = ['--migrate-only']) =>
    promisify(execFile)(process.execPath, ['--import', tsx, bootstrapPath, ...args], {
      cwd: directory,
      env: { ...process.env, APP_SECRET: 'synthetic-secret-must-not-be-logged' },
    });
  const first = await run();
  assert.match(first.stdout, /Applied application migration: 0002-initialize-app-secret/);
  assert.doesNotMatch((await run()).stdout, /Applied application migration/);
  unlinkSync(keyPath(directory));
  await assert.rejects(
    run([]),
    (error: Error & { code: number; stdout: string; stderr: string }) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /restore it from backup/);
      assert.doesNotMatch(error.stdout + error.stderr, /synthetic-secret-must-not-be-logged/);
      return true;
    },
  );
});
