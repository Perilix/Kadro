# API Kadro — image unique du monorepo (apps/api + packages buildés).
# Node 22 (glibc) : binaires précompilés argon2 disponibles, même version qu'en dev.

FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app

# Manifestes d'abord pour mettre l'install en cache de layer.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/tokens/package.json packages/tokens/
# --prod=false : les devDependencies (tsc, @nestjs/cli) sont nécessaires au build.
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm --filter @kadro/tokens build \
 && pnpm --filter @kadro/shared build \
 && pnpm --filter @kadro/api build
# Réinstalle en prod-only : node_modules ne garde que le runtime.
RUN pnpm install --frozen-lockfile --prod

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
# On copie l'arbre entier : les liens workspace de pnpm (shared, tokens) restent valides.
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
