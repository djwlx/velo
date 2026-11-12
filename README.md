# velo

Turborepo monorepo for the Velo project.

## Apps

- `apps/web`: Vite + React web client (`@velo/web`)
- `apps/server`: Hono + Drizzle API server (`@velo/server`)

## Packages

- `packages/shared` (`@velo/shared`): shared runtime code and types

## Environment

Node version is pinned in the root `.nvmrc`; pnpm is pinned in `package.json`.

```sh
nvm install
nvm use
npm install --global pnpm@12.18.0
```

## Development

Install dependencies:

```sh
pnpm install
```

Run all apps in dev mode:

```sh
pnpm dev
```

Run a single app:

```sh
pnpm dev --filter=@velo/web
pnpm dev --filter=@velo/server
```

## Tasks

- `pnpm build`: build all apps
- `pnpm lint`: lint all apps (oxlint)
- `pnpm check-types`: type-check all apps
- `pnpm format`: format all apps (oxfmt)

## Release

Run `./scripts/release.mjs` from a clean working tree to fetch tags, increment the root
package's patch version, and push a new `v` tag to `origin`. The release workflow
builds from that tag and updates package versions.

## Server

Start the server without creating an env file:

```sh
pnpm dev --filter=@velo/server
```

Startup prepares the data directories, applies database and application migrations,
and then starts the HTTP server. New installations generate a private key in
`apps/server/data/app-secret` automatically.

The server reads its key exclusively from `data/app-secret`; environment variables
and `.env` files are not used for the key. Existing persisted keys are reused
without modification. Back up the entire `data` directory, including `app-secret`,
together with the database. If the key is missing from an existing installation,
restore it from backup.

To prepare data and run migrations without starting HTTP, use
`pnpm --filter @velo/server migrate`. See
[server migration instructions](apps/server/README.md#application-migrations).
