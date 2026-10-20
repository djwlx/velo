import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export const DATA_DIRECTORY = path.resolve(process.cwd(), 'data');

const sqlite = new Database(path.join(DATA_DIRECTORY, 'index.db'));
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite);
