# Plant Care

Plant Care is a full-stack monorepo for tracking plants, schedules, and care history.

It contains:

- A Vue 3 frontend (`frontend/`)
- A Bun + Hono backend API (`backend/`)
- A shared package for cross-layer contracts (`shared/`)
- OpenAPI documentation (`docs/api/openapi.yaml`)

## Monorepo Structure

- `backend/`: API server, database setup, queue worker, Docker config
- `frontend/`: Vue app (Vite + Pinia + Vue Router)
- `shared/`: Shared validation/types used by frontend and backend
- `docs/api/`: API spec (`openapi.yaml`) and Postman collection
- `scripts/`, `utils/`: workspace helper scripts

## Tech Stack

- Frontend: Vue 3, TypeScript, Vite, Tailwind CSS, Pinia
- Backend: Bun, Hono, Zod, Drizzle ORM, BullMQ
- Data: SQLite (persisted via Docker volume), Redis
- Tooling: ESLint, Prettier, TypeScript workspaces

## Prerequisites

Required:

- Node.js 20+
- npm 10+
- Docker + Docker Compose

Optional (only if you want to run backend scripts outside Docker):

- Bun

## Getting Started

### 1. Install dependencies

From repository root:

```bash
npm install
```

### 2. Configure environment variables

Backend:

```bash
copy backend/.env.template backend/.env
```

Frontend:

```bash
copy frontend/.env.template frontend/.env
```

Update values in both files as needed.  
If you want to test a feature that requires email sending, you can setup credentials for it following this guide (for gmail accounts): https://medium.com/rails-to-rescue/how-to-set-up-smtp-credentials-with-gmail-for-your-app-send-email-cf236d11087d

### 3. Start backend, run migrations/seed once

```bash
npm run dev:backend-setup
```

This starts the backend stack in Docker and runs:

- `migrate`
- `seed`

### 4. Start frontend

```bash
npm run dev:frontend
```

Frontend defaults to `http://localhost:5173` and API to `http://localhost:5000/api`.

### 5. Start both together (alternative)

```bash
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

The template includes:

- `SERVER_BASE_URL`
- `PORT`
- `COOKIE_SECRET`
- `COOKIE_MAX_AGE`
- `CLIENT_BASE_URL`
- `DB_SQLITE_FILE`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MAILER_SERVICE`
- `MAILER_HOST`
- `MAILER_PORT`
- `MAILER_SECURE`
- `MAILER_USER`
- `MAILER_PASS`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRATION`
- `REFRESH_TOKEN_EXPIRATION`
- `NGROK_AUTHTOKEN`
- `NGROK_DOMAIN`
- `REDIS_URL`

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL`

## Available Scripts

From repository root:

- `npm run dev`: Start backend (Docker) and frontend concurrently
- `npm run dev:backend`: Start backend Docker stack
- `npm run dev:backend-setup`: Start backend Docker stack with setup (migrate + seed)
- `npm run dev:frontend`: Start Vite frontend dev server
- `npm run build`: Build frontend
- `npm run preview`: Preview frontend build
- `npm run lint`: Run lint for backend + frontend
- `npm run typecheck`: Run type checking for backend + frontend
- `npm run format`: Format backend + frontend
- `npm run format:check`: Check formatting for backend + frontend

Backend workspace scripts:

- `npm run -w @plant-care/backend dev`
- `npm run -w @plant-care/backend migrate`
- `npm run -w @plant-care/backend seed`
- `npm run -w @plant-care/backend worker:email`

Frontend workspace scripts:

- `npm run -w @plant-care/frontend dev`
- `npm run -w @plant-care/frontend build`
- `npm run -w @plant-care/frontend preview`

## API Documentation

- OpenAPI: `docs/api/openapi.yaml`
- Postman collection: `docs/api/postman_collection.json`

## Authentication Notes

- Access token: bearer token for protected API routes
- Refresh token: stored in `refresh_token` cookie
- Refresh endpoint: `POST /api/users/refresh`

## Data and Persistence

- SQLite file path is configured by `DB_SQLITE_FILE`
- In Docker dev, SQLite data is persisted in the `sqlite_data` volume
- Redis runs in a separate container (`redis`)

## Development Conventions

- Keep shared contracts in `shared/` as the source of truth
- Update shared + backend + frontend together when contract fields change

## Troubleshooting

- Backend does not start: verify `backend/.env` is present and complete
- CORS/auth issues: ensure `CLIENT_BASE_URL` matches the frontend origin
- Refresh/login cookie problems: check backend and frontend are using `credentials: include`
- Redis/worker issues: confirm Docker services `redis`, `server`, and `worker` are running
