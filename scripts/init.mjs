import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(repositoryRoot, "apps", "server", "data");

for (const directory of ["uploads", "files", "logs"]) {
  mkdirSync(path.join(dataDirectory, directory), {
    recursive: true,
    mode: 0o700,
  });
}

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const migration = spawnSync(packageManager, ["--filter", "@velo/server", "db:migrate"], {
  cwd: repositoryRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

console.log("Server data folders are ready and database migrations are applied.");
