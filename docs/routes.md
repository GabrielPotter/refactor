# Routing Layer (`src/routes`)

Express routers define HTTP endpoints, orchestrate validation, and delegate to repositories or services. All routers use async handlers with structured 400/404/500 responses.

## Tree Router (`treeRouter.ts`)
- Base path: `/api1/tree`.
- Endpoints:
  - `GET /`: list all trees.
  - `POST /`: create tree (`{ name }`).
  - `PUT /:treeId`: rename tree.
  - `DELETE /:treeId`: delete tree.
- Input validation ensures `name` is a trimmed non-empty string.

## Node Router (`nodeRouter.ts`)
- Base path: `/api1/node/:treeId`.
- Supports both hierarchical and flat node access:
  - `GET /`: list children (optional `parentId` query).
  - `GET /all`: list all nodes ordered by Euler traversal.
  - `POST /`: create node (`name`, optional `parentId`, `position`, `props`, `categoryId`).
  - `GET /item/:nodeId`: fetch single node.
  - `PATCH /item/:nodeId`: update `name`, `position`, `categoryId`.
  - `GET /item/:nodeId/path`: fetch path to root with depth metadata.
  - `GET /item/:nodeId/subtree`: fetch nested nodes (optional `maxDepth`).
  - `POST /item/:nodeId/move`: move subtree.
  - `DELETE /item/:nodeId`: delete subtree rooted at node.
  - `GET /by-type/:type`: filter nodes by `props.type`.
  - `POST /item/:nodeId/counter`: increment JSON counter (`counter`, optional `delta`).
- Validation normalizes empty strings to `null` where appropriate and checks numeric payloads.

## Category Router (`categoryRouter.ts`)
- Base path: `/api1/node-categories`.
- Endpoints:
  - `GET /`: list categories filtered by `parentId` query (`null`, ID, or all).
  - `POST /`: create category with optional props.
  - `GET /:categoryId`: fetch by ID; optionally by `?name=`.
  - `PATCH /:categoryId`: update name/props/parent with guard against self-parenting.
  - `DELETE /:categoryId`: delete category.
- Strong runtime validation ensures props are serializable objects.

## Layer Router (`layerRouter.ts`)
- Base path: `/api1/layer`.
- Endpoints mirror tree CRUD (list, create, fetch, rename, delete).

## Edge Router (`edgeRouter.ts`)
- Base path: `/api1/edge`.
- Endpoints:
  - `GET /`: list all edges or filter by `layerId` query.
  - `POST /:layerId`: create edge from `from` → `to`.
  - `GET /item/:edgeId`: fetch single edge.
  - `PATCH /item/:edgeId`: update name, `layerId`, endpoints, or props.
  - `DELETE /item/:edgeId`: delete edge.
- Input validation keeps IDs as trimmed strings and guards against malformed props.

## Metrics Router (`metricsRouter.ts`)
- Base path: `/api1/metrics`.
- `GET /`: returns latency snapshot (`LatencyStats.snapshot()`).
- `POST /reset`: clears stored metrics.
- Custom error handler logs errors to stderr and returns a 500-specific payload.

## Console Router (`consoleRouter.ts`)
- Base path: `/api2/console`.
- `POST /`: execute DSL scripts using `CommandInterpreter`.
- Validates that `command` is a non-empty string; returns logs and interpreter results or error diagnostics.
