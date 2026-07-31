#!/bin/sh
set -e

echo "🚀 Starting Container Entrypoint Initialization..."

if [ "$NODE_ENV" = "production" ] && [ -f "./prisma/schema.prisma" ]; then
  echo "🗄️ Running Prisma Production Migrations..."
  ./node_modules/.bin/prisma migrate deploy || echo "⚠️ Migration warning: verify database connectivity"
fi

echo "✅ Container Initialization Complete. Executing application command..."
exec "$@"
