import { count, eq, sql } from 'drizzle-orm';

import { db } from '../../../libs/db/index.js';
import { files115 } from '../schema.js';

export type Cached115File = typeof files115.$inferSelect;
export type NewCached115File = typeof files115.$inferInsert;

export function getFileCount(fileClass: string): number {
  const row = db
    .select({ value: count() })
    .from(files115)
    .where(eq(files115.class, fileClass))
    .get();
  return row?.value ?? 0;
}

export function getFileByIndex(fileClass: string, index: number): Cached115File | undefined {
  return db
    .select()
    .from(files115)
    .where(eq(files115.class, fileClass))
    .limit(1)
    .offset(index)
    .get();
}

export function bulkUpsertFiles(files: NewCached115File[]): number {
  if (!files.length) return 0;
  const result = db
    .insert(files115)
    .values(files)
    .onConflictDoUpdate({
      target: files115.pc_code,
      set: {
        class: sql`excluded."class"`,
        cid: sql`excluded."cid"`,
        name: sql`excluded."name"`,
        size_bytes: sql`excluded."size_bytes"`,
        cached_at: sql`excluded."cached_at"`,
      },
    })
    .run();
  return result.changes;
}

export function clearFilesByClass(fileClass: string): number {
  return db.delete(files115).where(eq(files115.class, fileClass)).run().changes;
}
