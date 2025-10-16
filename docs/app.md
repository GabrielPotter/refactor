# Application Bootstrap (`src/index.ts`)

The Express application is composed in `src/index.ts`. The file handles connection pooling, repository wiring, middleware registration, and GUI hosting in a single place.

## Responsibilities
- Build a PostgreSQL connection pool using the standard `PG*` / `POSTGRES_*` environment variables (with sensible defaults for local development).
- Wrap the pool with a Drizzle client and instantiate the repositories used by the HTTP layer.
- Configure request metrics (`ParamGrouping`, `latencyCollector`), Swagger, and static GUI hosting under `/gui`.
- Mount the REST routers for trees, nodes, categories, layers, edges, metrics, and the DSL console.

## Environment Variables

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `PGHOST` / `POSTGRES_HOST` | Database host | `localhost` |
| `PGPORT` / `POSTGRES_PORT` | Database port | `5432` |
| `PGDATABASE` / `POSTGRES_DB` | Database name | `refactor` |
| `PGUSER` / `POSTGRES_USER` | Database user | `refactor` |
| `PGPASSWORD` / `POSTGRES_PASSWORD` | Database password | `refactor` |

## Middleware Flow
1. `express.json()` parses request bodies.
2. `ParamGrouping.addRule` narrows the set of tracked routes.
3. `latencyCollector` captures response times.
4. Swagger UI is mounted.
5. GUI assets from `dist/gui` are served under `/gui`.

Errors fall through to the final handler, which logs the issue and responds with a `500`.

## Startup and Teardown
`createApp()` now creates the pool and repositories internally. `startServer()` simply calls `createApp()`, starts listening on `PORT` (default `3000`), and ensures the pool is closed when the HTTP server shuts down. Import `createApp()` directly in tests if you need an Express instance without launching the listener.
