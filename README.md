# Focus Todo — REST API

The Express + TypeScript + PostgreSQL API for the Focus Todo internship project. It provides validated CRUD endpoints and durable database persistence.

## Run locally

Requires Node.js 20+ and Docker Desktop.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

The API starts at http://localhost:3000/api. Check it with `GET /api/health`.

For a temporary UI demo on a machine without PostgreSQL or Docker, run `DEMO_MODE=true npm run dev`. Demo data survives browser refreshes but resets when the API process stops; normal mode always uses PostgreSQL.

## REST endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/todos` | List tasks |
| `GET` | `/api/todos/:id` | Read one task |
| `POST` | `/api/todos` | Create a task |
| `PATCH` | `/api/todos/:id` | Update fields or completion status |
| `DELETE` | `/api/todos/:id` | Delete one task |
| `DELETE` | `/api/todos/completed` | Delete all completed tasks |

Example request:

```json
{
  "title": "Prepare internship demo",
  "description": "Explain the architecture",
  "priority": "high",
  "dueDate": "2026-09-20"
}
```

## Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

The API initializes its idempotent PostgreSQL schema on startup. SQL queries are parameterized, and request bodies are validated with Zod. Tests use Supertest with an in-memory repository so HTTP behavior can be checked independently of a local database.

## Frontend

Vue application: https://github.com/htay-htay-thwe/focus-todo-frontend

## Postman

Import `postman/Focus-Todo.postman_collection.json` from this repository and run requests in order.

## License

MIT
