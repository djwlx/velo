import { constants } from 'node:fs';
import { lstat, open, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import type { ManagedFile } from '@velo/shared';
import { lookup } from 'mime-types';

import { localPathSchema } from './validation.js';

export const LOCAL_FILES_DIRECTORY = path.resolve(process.cwd(), 'data', 'files');

export class LocalFileError extends Error {
  constructor(public readonly status: 400 | 403 | 404) {
    super('Local file unavailable');
  }
}

export const isMissingFile = (error: unknown): boolean =>
  error instanceof Error &&
  'code' in error &&
  (error.code === 'ENOENT' || error.code === 'ENOTDIR');

const isWithin = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
};

export function createLocalFileStore(directory = LOCAL_FILES_DIRECTORY) {
  const root = path.resolve(directory);

  const resolveEntry = async (relativePath: string) => {
    const parsed = localPathSchema.safeParse(relativePath);
    if (!parsed.success) throw new LocalFileError(400);

    const rootInfo = await lstat(root);
    if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new LocalFileError(403);
    const canonicalRoot = await realpath(root);
    let target = root;
    let metadata = rootInfo;
    for (const segment of relativePath ? relativePath.split('/') : []) {
      target = path.join(target, segment);
      metadata = await lstat(target);
      if (metadata.isSymbolicLink()) throw new LocalFileError(403);
    }
    if (!isWithin(root, target) || !isWithin(canonicalRoot, await realpath(target))) {
      throw new LocalFileError(403);
    }
    return { target, metadata };
  };

  const describe = async (relativePath: string): Promise<ManagedFile> => {
    const { metadata } = await resolveEntry(relativePath);
    if (!metadata.isFile() && !metadata.isDirectory()) throw new LocalFileError(404);
    const name = path.basename(relativePath);
    return {
      id: relativePath,
      name,
      path: relativePath,
      source: 'local',
      isDirectory: metadata.isDirectory(),
      size: metadata.isDirectory() ? 0 : metadata.size,
      contentType: metadata.isFile() ? lookup(name) || 'application/octet-stream' : null,
      modifiedAt: metadata.mtime.toISOString(),
    };
  };

  return {
    describe,
    async list(relativePath: string): Promise<ManagedFile[]> {
      let resolved: Awaited<ReturnType<typeof resolveEntry>>;
      try {
        resolved = await resolveEntry(relativePath);
      } catch (error) {
        if (relativePath === '' && isMissingFile(error)) return [];
        throw error;
      }
      if (!resolved.metadata.isDirectory()) throw new LocalFileError(404);
      const entries = await readdir(resolved.target, { withFileTypes: true });
      const items: ManagedFile[] = [];
      // Bound concurrent filesystem operations, including for large directories.
      for (let start = 0; start < entries.length; start += 64) {
        const batch = await Promise.all(
          entries.slice(start, start + 64).map(async (entry) => {
            if (!entry.isFile() && !entry.isDirectory()) return null;
            const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            if (!localPathSchema.safeParse(entryPath).success) return null;
            try {
              return await describe(entryPath);
            } catch (error) {
              if (isMissingFile(error) || error instanceof LocalFileError) return null;
              throw error;
            }
          }),
        );
        for (const item of batch) if (item) items.push(item);
      }
      return items.sort(
        (left, right) =>
          Number(right.isDirectory) - Number(left.isDirectory) ||
          left.name.localeCompare(right.name, 'zh-CN', { numeric: true }),
      );
    },

    async open(relativePath: string) {
      const { target, metadata } = await resolveEntry(relativePath);
      if (!metadata.isFile()) throw new LocalFileError(404);
      const file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const current = await file.stat();
        if (!current.isFile() || current.dev !== metadata.dev || current.ino !== metadata.ino) {
          throw new LocalFileError(403);
        }
        return { file, metadata: current };
      } catch (error) {
        await file.close();
        throw error;
      }
    },
  };
}
