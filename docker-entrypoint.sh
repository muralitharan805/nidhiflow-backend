#!/bin/sh
set -e

echo "🚀 Starting Container Entrypoint Initialization..."

if [ -f "./prisma/schema.prisma" ]; then
  echo "🔄 Generating Prisma Client..."
  pnpm run prisma:generate || true

  if [ "$NODE_ENV" = "production" ]; then
    echo "🗄️ Running Prisma Production Migrations..."
    pnpm exec prisma migrate deploy || echo "⚠️ Migration warning: verify database connectivity"
  fi
fi

echo "✅ Container Initialization Complete. Executing application command..."
exec "$@"
