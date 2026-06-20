# JiranTetangga

A monorepo for the **JiranTetangga** community management platform — backend API + frontend web app, managed with **pnpm workspaces**.

> Consolidated from the legacy `jiran-tetangga/` (backend) and `jiran-tetangga-web/` (frontend) repositories.

---

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Workspace Packages](#workspace-packages)
- [Deployment](#deployment)
- [Migration Notes](#migration-notes)
- [Stack](#stack)

---

## Monorepo Structure

```
jiran-tetangga-app/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definitions
├── tsconfig.base.json        # Shared TypeScript config
├── .env                      # Backend env vars
├── .gitignore
├── Dockerfile                # Backend Docker image
├── docker-compose.yaml       # Backend + MongoDB stack
├── run-local.sh              # One-shot dev launcher
├── README.md
│
├── packages/
│   ├── api-server/           # Backend (Express 5 + MongoDB, CommonJS)
│   │   ├── app.js            # Express app entry
│   │   ├── index.js          # Server entry
│   │   ├── middleware/       # Auth, API checks
│   │   ├── modules/          # Feature modules (bookings, events, …)
│   │   ├── swagger/          # OpenAPI spec generation
│   │   ├── utilities/        # DB client, JWT, logger, secrets
│   │   ├── test/             # Mocha + chai tests
│   │   ├── Dockerfile
│   │   ├── docker-compose.yaml
│   │   └── package.json
│   │
│   └── jiran-tetangga/       # Frontend (React 19 + Vite, ESM)
│       ├── src/              # App source
│       ├── public/           # Static assets
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
│
└── lib/
    ├── api-zod/              # Shared Zod request/response schemas
    └── api-client-react/     # Shared React hooks for API calls
```

---

## Requirements

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **MongoDB** — local install or Docker

Verify:
```bash
node --version   # v20.x or later
pnpm --version   # 9.x or later
```

---

## Quick Start

### 1. Install dependencies

```bash
cd jiran-tetangga-app
pnpm install
```

This installs all workspace packages and links cross-package dependencies (e.g. `@workspace/api-client-react`).

### 2. Configure environment

The repo ships with a `.env` at the root containing backend defaults. Override per-machine if needed:

```bash
# Required backend vars (defaults live in .env)
MONGODB_URI=mongodb://localhost:27017/jiran-tetangga
JWT_KEY=<your-secret>
ENCRYPTION_KEY=<your-key>

# Required frontend vars (set by run-local.sh or your shell)
PORT=3000              # Vite dev server port
BASE_PATH=/            # Vite public base path
VITE_API_BASE_URL=http://localhost:8118/jiran-tetangga/v1
```

### 3. Start development

```bash
# Option A: one-shot launcher (recommended)
chmod +x run-local.sh
./run-local.sh

# Option B: separate terminals
pnpm dev:api     # Backend (nodemon on PORT=8118)
pnpm dev:web     # Frontend (Vite on PORT=3000)
```

| Service  | URL                                              |
|----------|--------------------------------------------------|
| Frontend | http://localhost:3000                            |
| API      | http://localhost:8118/jiran-tetangga/v1          |
| Swagger  | http://localhost:8118/jiran-tetangga/v1/docs     |

---

## Scripts

### Root (`package.json`)

| Command          | What it does                                                |
|------------------|-------------------------------------------------------------|
| `pnpm dev`       | Start **all** dev servers in parallel (backend + frontend)  |
| `pnpm dev:api`   | Backend only — `pnpm --filter @workspace/api-server run dev` |
| `pnpm dev:web`   | Frontend only — `pnpm --filter @workspace/jiran-tetangga run dev` |
| `pnpm build`     | Build every package that exposes a `build` script           |
| `pnpm typecheck` | Run `tsc --noEmit` across packages                          |
| `pnpm lint`      | ESLint across packages                                      |
| `pnpm test`      | Run test suites across packages                             |

### Per-package

**`packages/api-server`** (CommonJS)

| Command          | What it does                                  |
|------------------|-----------------------------------------------|
| `pnpm dev`       | nodemon + auto-regen swagger + start          |
| `pnpm start`     | Production start (`node app.js`)              |
| `pnpm start:dev` | Regenerate Swagger spec then start            |
| `pnpm swagger`   | Regenerate `swagger/swagger-output.json`      |
| `pnpm test`      | Mocha test suite                              |
| `pnpm lint`      | ESLint                                        |

**`packages/jiran-tetangga`** (ESM)

| Command          | What it does                                  |
|------------------|-----------------------------------------------|
| `pnpm dev`       | Vite dev server on `--host 0.0.0.0`           |
| `pnpm build`     | Production build to `dist/public`             |
| `pnpm serve`     | Preview the production build                  |
| `pnpm typecheck` | `tsc --noEmit`                                |

---

## Environment Variables

### Backend (`packages/api-server/.env`)

| Variable                | Default                              | Purpose                              |
|-------------------------|--------------------------------------|--------------------------------------|
| `HOSTNAME`              | `localhost`                          | API hostname                         |
| `PORT`                  | `8118`                               | API server port                      |
| `NODE_ENV`              | `local`                              | Runtime mode                         |
| `ROUTE_PREPEND`         | `jiran-tetangga`                     | URL prefix for all routes            |
| `API_VERSION`           | `1.0.0`                              | Reported API version                 |
| `APP_VERSION`           | `1.0.0`                              | Reported app version                 |
| `VERSION`               | `v1`                                 | Version segment in URL               |
| `MONGODB_URI`           | `mongodb://mongodb:27017/jiran-tetangga` | Mongo connection string           |
| `MONGODB_DBNAME`        | `jiran-tetangga`                     | Database name                        |
| `MONGO_URI`             | `mongodb://localhost:27017/`         | Fallback Mongo URI for local dev     |
| `JWT_KEY`               | —                                    | JWT signing secret                   |
| `ENCRYPTION_KEY`        | —                                    | AES encryption key                   |
| `API_KEY`               | —                                    | Static API key for service clients   |
| `INFISICAL_URI`         | `https://app.infisical.com`          | Secrets manager endpoint             |
| `INFISICAL_PROJECT_ID`  | —                                    | Infisical project id                 |
| `INFISICAL_CLIENT_ID`   | —                                    | Infisical OAuth client id            |
| `INFISICAL_CLIENT_SECRET`| —                                   | Infisical OAuth client secret        |
| `INFISICAL_ENV`         | `dev`                                | Infisical environment                |

### Frontend

| Variable             | Default                                             | Purpose                          |
|----------------------|-----------------------------------------------------|----------------------------------|
| `PORT`               | `3000`                                              | Vite dev server port             |
| `BASE_PATH`          | `/`                                                 | Public base path for Vite        |
| `VITE_API_BASE_URL`  | `http://localhost:8118/jiran-tetangga/v1`           | API base URL                     |

---

## Workspace Packages

| Package                          | Path                       | Module system | Description                                |
|----------------------------------|----------------------------|---------------|--------------------------------------------|
| `@workspace/api-server`          | `packages/api-server`      | CommonJS      | Express 5 API server + MongoDB             |
| `@workspace/jiran-tetangga`      | `packages/jiran-tetangga`  | ESM           | React 19 frontend (Vite)                   |
| `@workspace/api-zod`             | `lib/api-zod`              | ESM           | Zod schemas for request/response validation |
| `@workspace/api-client-react`    | `lib/api-client-react`     | ESM           | React hooks (TanStack Query) for the API   |

The frontend consumes shared libs via `workspace:*`:

```jsonc
// packages/jiran-tetangga/package.json
{
  "devDependencies": {
    "@workspace/api-client-react": "workspace:*"
  }
}
```

---

## Deployment

### Docker

The root `docker-compose.yaml` runs the backend + MongoDB. From the repo root:

```bash
docker-compose up --build
```

For frontend deployment, build the static bundle and serve with any static host (or extend `docker-compose.yaml`):

```bash
pnpm --filter @workspace/jiran-tetangga build
# Output: packages/jiran-tetangga/dist/public
```

---

## Migration Notes

This monorepo was consolidated from two legacy repos:

- **`jiran-tetangga/`** → `packages/api-server/` — kept as **CommonJS** to avoid rewriting the entire Express app. Files use `require()` / `module.exports`.
- **`jiran-tetangga-web/`** → `packages/jiran-tetangga/` + `lib/api-zod` + `lib/api-client-react` — already pnpm-workspace + ESM, copied as-is.

### `catalog:` references

The frontend's `package.json` uses `catalog:` versions (e.g. `"vite": "catalog:"`). These resolve through the `catalog:` block in `pnpm-workspace.yaml`. If you add new packages, declare versions there:

```yaml
# pnpm-workspace.yaml
packages:
  - packages/*
  - lib/*

catalog:
  vite: ^7.0.0
  react: ^19.0.0
  # …
```

---

## Stack

- **Package manager**: pnpm workspaces
- **Backend**: Node.js 20+, Express 5, MongoDB 6+, Swagger-autogen, JWT, Winston, Mocha
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, wouter
- **Shared libs**: Zod (validation), TanStack Query (data fetching)
- **Infra**: Docker, Infisical (secrets)