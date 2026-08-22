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
| `SEED_DB` | Set to `true` to automatically execute database seeding on container startup in production | `false` | No |
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

### 📦 1. Building & Pushing Remote Container Images
```bash
# Build production container image locally
docker build -t seyalicraft/nidhiflow-backend:latest .

# Push pre-built image to Docker Hub
docker push seyalicraft/nidhiflow-backend:latest
```

### 🏗️ 2. Mandatory 6-File Compose Topology Overview
- `docker-compose.yml`: Primary application service, bridge network (`nidhiflow-network`), and default configuration.
- `docker-compose.override.yml`: Development overrides (hot-reloading source mounts, `pnpm run start:dev`).
- `docker-compose.prod.yml`: Production overrides (resource limits, `json-file` log rotation).
- `docker-compose.shared.yml`: Standalone backing infrastructure (`ankane/pgvector:v0.5.1`, `redis:7.2-alpine`, `redis/redisinsight:latest`).
- `docker-compose.existing-infra.yml`: Cost-saver overrides connecting application container to external networks (`db_network`, `redis_network`).
- `docker-compose.repo.yml`: Pre-built remote image layer (`seyalicraft/nidhiflow-backend:latest`) for zero-compilation VPS deployments.

### 🚀 3. Environment Execution Modes

#### Mode A: Standalone Infrastructure Mode (Dedicated Postgres + Redis + RedisInsight)
```bash
# Local Development (Hot-reloading + Source Volume Mounts)
docker compose -f docker-compose.shared.yml -f docker-compose.yml -f docker-compose.override.yml up -d --build

# Production Deployment (Resource Limits + Restart Policies)
docker compose -f docker-compose.shared.yml -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### Mode B: Shared Infrastructure Cost-Saver Mode (Existing Container Network)
```bash
# Multi-file compose layer merging on existing infra network
docker compose -f docker-compose.yml -f docker-compose.existing-infra.yml up -d --build
```

#### Mode C: Pre-Built Remote Image Mode (No VPS Source Code Compilation)
```bash
# Pull and launch pre-built image from Docker Hub without local compilation
docker compose -f docker-compose.existing-infra.yml -f docker-compose.repo.yml up -d --pull always
```

### 🛠️ Useful Container Management Commands

```bash
# View live application container logs
docker compose logs -f app

# Inspect healthcheck status
docker inspect --format='{{json .State.Health}}' nidhiflow-backend-app

# Stop and remove containers
docker compose down

# Manually execute database seed in a running production container
docker compose exec app node prisma/seed.js
```

## 🚀 Automated Deployment via GitHub Actions

This project is configured for automated SSH deployments using GitHub Actions (`.github/workflows/deploy.yml`). Upon pushing to the `main` or `master` branch, the CI/CD pipeline connects to your remote VPS server via SSH, pulls the latest compose files, and executes a zero-compilation deployment pulling pre-built images (`seyalicraft/nidhiflow-backend:latest`) from Docker Hub.

### 🔐 Required GitHub Repository Secrets

Configure the following secrets under `Settings > Secrets and variables > Actions > New repository secret`:

| Secret Name | Description | Example / Required Format |
| :--- | :--- | :--- |
| `SERVER_HOST` | Public IP address or domain name of your VPS server | `192.0.2.1` or `api.seyalicraft.com` |
| `SERVER_USERNAME` | Non-root or root SSH user account on the server | `ubuntu`, `deploy`, `root` |
| `SERVER_SSH_KEY` | Raw private SSH key for authentication (must match `~/.ssh/authorized_keys` on VPS) | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `SERVER_PORT` | SSH listening port on the target VPS | `22` (default) or custom port `2001` |
| `PROJECT_PATH` | Absolute directory path on the VPS where the project is cloned | `/home/ubuntu/nidhiflow-backend` |


