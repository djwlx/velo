```
Node Version: 26.13.1
pnpm Version: 12.18.0
```

```
pnpm install
pnpm run dev
```

Development, production (`pnpm start`) and Docker all use the same bootstrap.
It prepares `data`, applies Drizzle migrations, runs pending application migrations,
then loads the application and starts the HTTP server. No env file is required
for a new installation. The database and private key are created at runtime,
never during an image build.

## Application migrations

`data/index.db` contains the `velo_app_migrations` journal: migration ID, checksum,
and completion time. Active migration checksums are SHA-256 hashes of their
original TypeScript source. Application migrations
run in order, under a database transaction, before business modules load.
Changed, missing or reordered applied migrations stop startup. A failure rolls
back pending database changes and journal entries; external file operations must
be idempotent so a retry can safely finish them.

Startup assumes one server instance per data directory. Run migrations while
that instance is stopped; startup does not create a separate lock database.

The server reads its key exclusively from `data/app-secret`. `APP_SECRET` environment
variables and `.env` files are ignored. No legacy configuration is loaded or
converted at startup.

The retired `0001-persist-app-secret` migration retains only its original journal
fingerprint; its legacy env implementation has been removed. Fresh installations
record that baseline without running any legacy conversion. Migration
`0002-initialize-app-secret` creates a 32-byte random key for a fresh installation,
or reuses an existing key unchanged. A temporary file is flushed before it is
renamed into place. On POSIX systems the key has permission `0600`.

Existing keys, encrypted Cookies and signed login tokens remain unchanged. Back
up the entire `data` directory together. If a key is missing or invalid after
initialization, startup stops; restore it from the same backup as the database.
Existing user/configuration data without a key also prevents generation of a
replacement. The private key is never printed or stored in the migration journal.

Run all pending migrations without starting HTTP:

```sh
pnpm run migrate
# In the deployed production directory:
node dist/bootstrap.js --migrate-only
```

To add a migration:

1. Add `src/migrations/steps/0003-description.ts` exporting a synchronous
   `up(context): undefined`. The context provides `sqlite` and `dataDirectory`.
   Use parameterized statements for data values.
2. Append its ID, source URL and function to `src/migrations/index.ts`.
   IDs must be unique and increasing; source URLs point into the original
   `src/migrations/steps` directory. Those sources ship alongside `dist` so
   development and production use identical checksums.
3. Make filesystem operations safe to repeat after an interruption. Never
   overwrite an existing key or rely on SQLite rollback to restore a file.
4. Add upgrade, repeat-run and failure/retry tests. Once released, keep the
   migration source unchanged; fix behavior through a subsequent migration.

Migration recovery uses forward fixes or restoration of a coordinated data
backup. Automatic down migrations are not provided.

## Server files

The file manager reads `data/files` relative to the server working directory.
In Docker this is `/app/data/files`, inside the existing `/app/data` volume.
Place files and subdirectories there; an absent or empty directory returns an empty list.
The operator may make `data/files` a symbolic link to the directory to browse.
Startup resolves that root without changing the target directory's permissions.
For Docker, bind-mount the target directory into `/app/data/files` instead of
using a host-only symbolic link whose target is absent inside the container.
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

Paths are relative to the canonical local files root. Traversal and symbolic
links beneath that root are rejected, including links back into the same root.
Supported media can be previewed; other file types are downloaded as attachments.
No endpoint writes to or deletes files in this directory.

The obsolete local-file mapping table is removed by the latest database migration.
Startup applies database and application migrations automatically.

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
