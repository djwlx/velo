```
Node Version: 24.20.0
pnpm Version: 10.27.0
```

```
pnpm install
mkdir data
pnpm run db:migrate
pnpm run dev
```

## Server files

The file manager reads `data/files` relative to the server working directory.
In Docker this is `/app/data/files`, inside the existing `/app/data` volume.
Place files and subdirectories there; an absent or empty directory returns an empty list.
Uploaded avatars remain in `data/uploads` and are separate from the file manager.

All file manager endpoints require login. Local listing and content additionally
require `module:files`; administrators receive this permission automatically,
and other roles can be granted it in role settings.

- `GET /api/files`: virtual root containing `115 网盘` and `本地文件`.
- `GET /api/files/local?path=&page=1&pageSize=50`: a local directory, with files,
  subdirectories, sizes, modification times, pagination, and breadcrumbs.
- Local video pages use `/video?type=local&path=<relative-path>`.
- `GET /api/files/local/content?path=folder/video.mp4`: stream a file, supporting
  single byte ranges for video seeking; `HEAD` returns metadata only.
- Add `download=1` to the content endpoint to force a download.

Paths are relative to the local files root. Traversal and symbolic links are rejected.
Supported media can be previewed; other file types are downloaded as attachments.
No endpoint writes to or deletes files in this directory.

The obsolete local-file mapping table is removed by the latest database migration.
Apply database migrations with `pnpm run db:migrate` before starting an updated server.

## Permissions

Roles can grant `file:read` and `file:write`. The built-in `admin` role has
administrator access; it is not grantable as an ordinary permission. Existing
`module:files` assignments migrate to `file:read`; other legacy module
permissions are removed.

## String mappings

Backend modules can reuse `getOrCreateStringId(namespace, value)` and
`resolveStringId(namespace, id)` from `src/modules/string-mapping/service.ts`.
The service has no HTTP endpoint; callers enforce their own authorization.

IDs contain exactly six characters from `a-z` and `0-9`, such as `k7m2x9`.
The database enforces globally unique IDs and unique `(namespace, value)` pairs.
Random collisions are retried up to ten times, then creation fails without
overwriting another mapping. Different namespaces cannot resolve each other's IDs.
Values may contain up to 16,384 characters, including an empty string, and are
stored unchanged. Namespaces use 1–64 lowercase letters, digits, or hyphens and
start with a letter. Mappings persist across restarts and have no automatic expiry;
their original strings are retained in SQLite and its backups until removed.

Run the API and filesystem security tests with:

```sh
pnpm exec turbo run test --filter=@velo/server
```

Tests create and remove their own temporary database and files, without accessing development data.
