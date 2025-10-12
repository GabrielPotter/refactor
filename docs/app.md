# Application Bootstrap (`src/index.ts`)

The Express application is instantiated in `src/index.ts`. The module coordinates connection pooling, dependency injection, middleware wiring, router mounting, and legacy GUI hosting.

## Responsibilities
- Build a PostgreSQL connection pool using environment variables (`PG*` or `POSTGRES_*`) with sane defaults.
- Instantiate a `Kysely<DB>` client (unless provided) and register repositories.
- Configure latency measurement (`ParamGrouping`, `latencyCollector`) and Swagger UI.
- Serve the React admin bundle from `dist/gui` under `/gui`.
- Expose REST routers for trees, nodes, categories, layers, edges, metrics, and the DSL console.
- Optionally enable development-only schema management endpoints guarded by the `ENABLE_DEV_SCHEMA_API` flag.

## Dependency Injection Surface
`createApp()` accepts an `AppDependencies` object so tests can supply mocks:

- `pool`, `db`: supply pre-configured database instances.
- `create*Repository`: allow injecting custom repository factories.
- `devSchema`, `createDevDb`, `devSchemaEnabled`: override schema management behavior.

When dependencies are omitted, `createApp()` creates defaults (e.g., `TreeRepository`, `NodeRepository`). The function also tracks whether it should destroy the Kysely instance on shutdown (`shouldDestroyDb`).

## Environment Variables

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `PGHOST` / `POSTGRES_HOST` | Database host | `localhost` |
| `PGPORT` / `POSTGRES_PORT` | Database port | `5432` |
| `PGDATABASE` / `POSTGRES_DB` | Database name | `refactor` |
| `PGUSER` / `POSTGRES_USER` | Database user | `refactor` |
| `PGPASSWORD` / `POSTGRES_PASSWORD` | Database password | `refactor` |
| `ENABLE_DEV_SCHEMA_API` | Toggle `/dev/schema/*` endpoints | `true` when `NODE_ENV !== "production"` |

## Middleware Flow
1. `express.json()` parses JSON bodies.
2. `ParamGrouping.addRule` registers allow-list entries for latency tracking.
3. `latencyCollector` records request duration for matched routes.
4. Swagger UI is mounted (`/docs` by default via `mountSwagger`).
5. Static assets from `dist/gui` are served under `/gui`.

Error handling is centralized at the end of the pipeline: any uncaught error generates a `500` JSON payload and is logged to stderr.

## Development Schema Endpoints
When enabled, the following POST endpoints are mounted:

- `/dev/schema/reset`: drop and recreate all tables.
- `/dev/schema/create`: create tables without dropping.
- `/dev/schema/drop`: drop tables.

Handlers acquire a temporary Kysely client (`createDevDb`) to isolate schema operations from the main pool. Errors are bubbled through `next()` while cleanup in `finally` ensures connections close.

## Startup and Teardown
`startServer()` creates the pool, builds the app, and begins listening on `PORT` (default `3000`). A `close` listener tears down the pool and the lazily created `Kysely` instance. The module runs `startServer()` automatically when invoked as the entrypoint (`node dist/index.js`).  

For tests, `createApp()` can be imported directly without starting the HTTP listener.
