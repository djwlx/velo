# velo

Turborepo monorepo for the Velo project.

## Apps

- `apps/web`: Vite + React web client (`@velo/web`)
- `apps/server`: Hono + Drizzle API server (`@velo/server`)

## Packages

- `packages/shared` (`@velo/shared`): shared runtime code and types

## Environment

Node version is pinned in the root `.nvmrc`.

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

## Server

Copy `apps/server/.env.example` to `apps/server/.env` and set `APP_SECRET`.

```sh
pnpm --filter=@velo/server db:migrate
pnpm --filter=@velo/server dev
```
