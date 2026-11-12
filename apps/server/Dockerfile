# Build context must be the repo root.
#
# Build the web app first and copy its output into apps/server/public, then:
#   pnpm --filter @velo/web build
#   mkdir -p apps/server/public && cp -R apps/web/dist/. apps/server/public/
#   docker build -f apps/server/Dockerfile -t velo .

FROM node:26.13.1-alpine AS build

WORKDIR /repo

RUN apk add --no-cache python3 make g++

# Install workspace dependencies (manifests first for better caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --global "$(node -p "require('./package.json').packageManager")" \
  && pnpm install --frozen-lockfile

# Build shared + server, then produce a self-contained deploy dir
COPY . .
RUN pnpm --filter @velo/server... build \
  && pnpm --filter @velo/server deploy --prod --legacy /out \
  && if [ -d apps/server/public ]; then cp -R apps/server/public /out/public; fi

FROM node:26.13.1-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /out ./

RUN mkdir -p /app/data/uploads /app/data/files && chmod 700 /app/data/uploads /app/data/files

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "dist/bootstrap.js"]
