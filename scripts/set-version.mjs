import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const version = process.argv[2];
if (!version) {
  console.error('usage: node scripts/set-version.mjs <version>');
  process.exit(1);
}

function workspacePatterns() {
  const content = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8');
  const patterns = [];
  let inPackages = false;

  for (const line of content.split('\n')) {
    if (/^packages\s*:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;

    const match = line.match(/^\s+-\s*['"]?([^'"\s]+)['"]?\s*$/);
    if (match) {
      patterns.push(match[1]);
      continue;
    }
    if (line.trim() !== '') break;
  }

  return patterns;
}

const files = new Set([resolve(root, 'package.json')]);
for (const pattern of workspacePatterns()) {
  for (const file of globSync(`${pattern}/package.json`, { cwd: root })) {
    files.add(resolve(root, file));
  }
}

for (const file of [...files].sort()) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  json.version = version;
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`${file.slice(root.length + 1)} -> ${version}`);
}
