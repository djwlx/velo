#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

try {
  if (git('status', '--porcelain')) {
    throw new Error('工作区有未提交的改动，请先提交或清理后再发布。');
  }

  const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const match = typeof version === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) throw new Error('package.json 的 version 必须是 x.y.z 格式的稳定版本。');

  const next = [BigInt(match[1]), BigInt(match[2]), BigInt(match[3]) + 1n];
  const tag = `v${next.join('.')}`;
  console.log('正在同步 origin 标签…');
  git('fetch', '--tags', 'origin');

  const tags = git('tag', '--list', 'v*').split('\n').filter(Boolean);
  const versions = tags.map((name) => {
    const parts = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(name);
    return parts ? { name, parts: parts.slice(1).map(BigInt) } : null;
  }).filter(Boolean);
  versions.sort((a, b) => {
    for (let i = 0; i < 3; i++) {
      if (a.parts[i] !== b.parts[i]) return a.parts[i] > b.parts[i] ? -1 : 1;
    }
    return 0;
  });
  const latest = versions[0];
  if (latest) {
    console.log(`最新稳定标签：${latest.name}`);
    const newer = next.some((part, i) => part > latest.parts[i] && next.slice(0, i).every((p, j) => p === latest.parts[j]));
    if (!newer) throw new Error(`${tag} 不大于最新标签 ${latest.name}，请先同步仓库版本。`);
  }

  git('tag', tag, 'HEAD');
  console.log(`已创建 ${tag}，正在推送到 origin…`);
  try {
    git('push', 'origin', `refs/tags/${tag}:refs/tags/${tag}`);
  } catch (error) {
    throw new Error(`推送失败，本地标签 ${tag} 已保留；检查远程状态后再处理。`, { cause: error });
  }
  console.log(`已推送 ${tag}。`);
} catch (error) {
  console.error(`发布失败：${error.message}`);
  process.exitCode = 1;
}
