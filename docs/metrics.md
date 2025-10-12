# Metrics & Instrumentation (`src/metrics`)

The metrics module captures HTTP latency for selected endpoints and exposes them via REST.

## ParamGrouping (`paramGrouper.ts`)
- Maintains an allow-list of route patterns with optional HTTP method filtering.
- `addRule({ path, keep, method })` registers rules. `keep` identifies route parameters whose values should be preserved; all others stay as placeholders.
- `matchAndAggregate(req)` returns a canonical route string (`/api1/tree/:treeId`) or `undefined` when the request should not be measured (e.g., missing route, unlisted path).

## latencyCollector (`latency.ts`)
- Express middleware created by `latencyCollector()`.
- Records `process.hrtime.bigint()` on request entry and listens for `finish` / `close`.
- After the response is sent, it checks `ParamGrouping` to decide whether to store the measurement.
- Latency is converted to milliseconds and stored in `LatencyStats` keyed by `METHOD path`.

## LatencyStats (`latencyStats.ts`)
- In-memory registry storing per-endpoint metrics:
  - `count`: number of recorded requests.
  - `minMs`, `maxMs`: extremes observed.
  - `avgMs`: computed via Welford’s online algorithm to avoid numerical drift.
- `snapshot()` returns a plain object suitable for JSON serialization; averages are rounded to two decimals.
- `reset()` clears aggregated data.

## API Integration
- `src/index.ts` registers allow-list rules for tree endpoints and installs `latencyCollector`.
- `createMetricsRouter()` exposes:
  - `GET /api1/metrics`: returns `{ latency: LatencyStats.snapshot() }`.
  - `POST /api1/metrics/reset`: resets stats.
- Router-level error handler logs and emits a JSON 500 response if aggregation fails.

## Extension Points
- Add new measurement rules by calling `ParamGrouping.addRule` early during app setup.
- Extend `LatencyStatsRegistry` to persist metrics externally (e.g., Prometheus) by publishing `update()` events.
