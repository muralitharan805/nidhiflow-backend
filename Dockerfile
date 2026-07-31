# Stage 1: Base Image
FROM node:22-alpine AS base

RUN npm install -g pnpm@11.1.3
WORKDIR /app

# Stage 2: Dependencies & Schema Stage
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma

# pnpm-workspace.yaml contains allowBuilds config for pnpm v11 security compliance

# Install dependencies with cache mount and generate Prisma Client
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run prisma:generate

# Stage 3: Build Stage
FROM dependencies AS build

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

# Stage 4: Production Runner Stage
FROM base AS runner

ENV NODE_ENV=production

# Copy pre-built artifacts directly with non-root ownership to avoid expensive runtime chown
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY --chown=node:node docker-entrypoint.sh ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma

RUN chmod +x docker-entrypoint.sh

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
