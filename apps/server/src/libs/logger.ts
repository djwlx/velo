import { appendFile, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import pino from 'pino';

const LOG_DIRECTORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/logs');

type DailyLogType = 'info' | 'error';

function getLocalDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

class DailyLogStream extends Writable {
  constructor(private readonly type: DailyLogType) {
    super();
    this.on('error', () => {
      process.stderr.write(`Failed to write ${this.type} log file.\n`);
    });
  }

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    let level: unknown;
    try {
      level = (JSON.parse(chunk.toString('utf8')) as { level?: unknown }).level;
    } catch {
      callback(new Error('Invalid structured log record'));
      return;
    }
    if (typeof level !== 'number' || (this.type === 'info' ? level > 30 : level <= 30)) {
      callback();
      return;
    }

    const filename = path.join(LOG_DIRECTORY, `${getLocalDate()}.${this.type}.log`);
    appendFile(filename, chunk, { mode: 0o600 }, callback);
  }
}

function createLogger() {
  const loggerOptions = {
    level: 'trace',
    hooks: {
      streamWrite: (log: string) => `${log}\n`,
    },
  };

  if (process.env.NODE_ENV !== 'production') return pino(loggerOptions);

  mkdirSync(LOG_DIRECTORY, { recursive: true, mode: 0o700 });
  const productionStream = pino.multistream([
    { level: 'trace', stream: new DailyLogStream('info') },
    { level: 'warn', stream: new DailyLogStream('error') },
    { level: 'error', stream: process.stderr },
  ]);

  return pino(loggerOptions, productionStream);
}

export const rootLogger = createLogger();
