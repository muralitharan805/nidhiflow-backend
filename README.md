# NidhiFlow Backend API

Production-grade NestJS backend service built with TypeScript, Prisma ORM, Zod environment validation, JWT Auth, and Swagger OpenAPI documentation.

## 🛠️ Tech Stack & Architectural Features

- **Framework**: NestJS v11+ (Clean Bounded-Context Domain Architecture)
- **Package Manager**: `pnpm@11.1.3` (Corepack & Frozen Lockfile)
- **Validation**: Zod (Environment schema) & `class-validator` (Global `ValidationPipe`)
- **Database & ORM**: PostgreSQL + `pgvector` + Prisma ORM (Migration-only schema mutations)
- **Authentication**: JWT Strategy + Passport Bearer Authentication & RBAC Decorators
- **API Response Envelope**: Global `TransformResponseInterceptor` (`{ success: true, statusCode, message, data, meta, timestamp, path }`)
- **Pagination**: Mandatory `PaginationQueryDto` on GET endpoints (`page`, `limit`, max 100)
- **API Documentation**: Interactive Swagger OpenAPI UI (`/api/docs`)
- **Observability & Health**: `@nestjs/terminus` Health Check Endpoint (`/api/v1/health`)
- **Containerization & CI**: Multi-stage `Dockerfile` + Modular Docker Compose + GitHub Actions CI Quality Gate (`.github/workflows/ci.yml`)

## 🔐 Environment Variables (`.env`)

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Application runtime environment (`development`, `production`, `test`) | `development` | Yes |
| `PORT` | HTTP Listening Server Port | `3000` | Yes |
| `DATABASE_URL` | PostgreSQL Database Connection String | - | Yes |
| `JWT_SECRET` | Secret key used for signing JWT Bearer tokens | - | Yes |
| `JWT_EXPIRES_IN` | Duration of issued JWT access tokens | `1d` | No |

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies via pnpm
pnpm install

# 2. Generate Prisma ORM Client
pnpm run prisma:generate

# 3. Execute Database Migrations
pnpm run db:migrate

# 4. Seed Database (Admin & Standard User accounts)
pnpm run db:seed

# 5. Launch Development Server
pnpm run start:dev
```

## 📚 Interactive API Documentation & Monitoring

- **Swagger OpenAPI UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check Endpoint**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

## 🐳 Docker Containerization & Multi-Environment Guide

### Mode A: Standalone Infrastructure Mode (Dedicated Postgres + Redis Containers)

```bash
# Local Development (Hot-reloading + Source Volume Mounts)
docker compose -f docker-compose.shared.yml -f docker-compose.yml -f docker-compose.override.yml up -d --build

# Production Deployment (Resource Limits + Restart Policies)
docker compose -f docker-compose.shared.yml -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Mode B: Shared Infrastructure Cost-Saver Mode (Existing Container Network)

```bash
# Option 1: Standalone Single-File Deployment
docker compose -f docker-compose.existing-infra.yml up -d --build

# Option 2: Multi-file compose layer merging
docker compose -f docker-compose.yml -f docker-compose.existing-infra.yml up -d --build
```

### Useful Container Management Commands

```bash
# View live application container logs
docker compose logs -f app

# Inspect healthcheck status
docker inspect --format='{{json .State.Health}}' nidhiflow-backend-app

# Stop and remove containers
docker compose down
```
