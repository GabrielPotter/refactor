import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

import { createDatabase } from "./db/client";
import { AppInfoRepository } from "./repositories/AppInfoRepository";
import { JsonSchemasRepository } from "./repositories/JsonSchemasRepository";
import { TreeRepository } from "./repositories/TreeRepository";
import { LayerRepository } from "./repositories/LayerRepository";
import { EdgeCategoryRepository } from "./repositories/EdgeCategoryRepository";
import { EdgeRepository } from "./repositories/EdgeRepository";
import { EdgeTypeRepository } from "./repositories/EdgeTypeRepository";
import { NodeCategoryRepository } from "./repositories/NodeCategoryRepository";
import { NodeRepository } from "./repositories/NodeRepository";
import { NodeTypeRepository } from "./repositories/NodeTypeRepository";
import { setupSwagger } from "./swagger";
import { createAppInfoRouter } from "./routes/AppInfoRouter";
import { createJsonSchemasRouter } from "./routes/JsonSchemasRouter";
import { createTreeRouter } from "./routes/TreeRouter";
import { createLayerRouter } from "./routes/LayerRouter";
import { createEdgeCategoryRouter } from "./routes/EdgeCategoryRouter";
import { createEdgeRouter } from "./routes/EdgeRouter";
import { createEdgeTypeRouter } from "./routes/EdgeTypeRouter";
import { createNodeCategoryRouter } from "./routes/NodeCategoryRouter";
import { createNodeRouter } from "./routes/NodeRouter";
import { createNodeTypeRouter } from "./routes/NodeTypeRouter";
import { createMetricsRouter } from "./routes/metricsRouter";
import { createConsoleRouter } from "./routes/consoleRouter";
import { latencyCollector } from "./metrics/latency";
import { ParamGrouping } from "./metrics/paramGrouper";
import { CollectEnvData } from "./CollectEnvData";
import { CommandInterpreter } from "./services/CommandInterpreter";
import { createServerExecutors } from "./services/ExecutorFns";

const createPool = (): Pool =>
  new Pool({
    host: process.env.PGHOST ?? process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.PGPORT ?? process.env.POSTGRES_PORT ?? 5432),
    user: process.env.PGUSER ?? process.env.POSTGRES_USER ?? "refactor",
    password: process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? "refactor",
    database: process.env.PGDATABASE ?? process.env.POSTGRES_DB ?? "refactor",
  });

export const createApp = () => {
  const app = express();
  CommandInterpreter.initialize(createServerExecutors());

  const pool = createPool();
  const db = createDatabase(pool);

  const repositories = {
    appInfo: new AppInfoRepository(db),
    jsonSchemas: new JsonSchemasRepository(db),
    trees: new TreeRepository(db),
    layers: new LayerRepository(db),
    edgeCategories: new EdgeCategoryRepository(db),
    edges: new EdgeRepository(db),
    edgeTypes: new EdgeTypeRepository(db),
    nodeCategories: new NodeCategoryRepository(db),
    nodes: new NodeRepository(db),
    nodeTypes: new NodeTypeRepository(db),
  };

  app.locals.pool = pool;
  app.locals.db = db;
  app.locals.repositories = repositories;

  app.use(express.json());
  ParamGrouping.addRule({ method: "PUT", path: "/api/trees", keep: [] });
  ParamGrouping.addRule({ method: "PUT", path: "/api/nodes", keep: [] });
  app.use(latencyCollector());
  setupSwagger(app);

  const guiDirectory = path.join(__dirname, "gui");
  const guiIndexPath = path.join(guiDirectory, "index.html");

  app.use("/gui", express.static(guiDirectory));
  app.use("/gui", (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    if (!fs.existsSync(guiIndexPath)) {
      res.status(404).json({ error: "GUI bundle not found. Please run npm run build:gui." });
      return;
    }

    res.sendFile(guiIndexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  app.use("/api/app-info", createAppInfoRouter(repositories.appInfo));
  app.use("/api/json-schemas", createJsonSchemasRouter(repositories.jsonSchemas));
  app.use("/api/trees", createTreeRouter(repositories.trees));
  app.use("/api/layers", createLayerRouter(repositories.layers));
  app.use("/api/edge-categories", createEdgeCategoryRouter(repositories.edgeCategories));
  app.use("/api/edges", createEdgeRouter(repositories.edges));
  app.use("/api/edge-types", createEdgeTypeRouter(repositories.edgeTypes));
  app.use("/api/node-categories", createNodeCategoryRouter(repositories.nodeCategories));
  app.use("/api/nodes", createNodeRouter(repositories.nodes));
  app.use("/api/node-types", createNodeTypeRouter(repositories.nodeTypes));
  app.use("/api/metrics", createMetricsRouter());
  app.use("/api/console", createConsoleRouter());

  app.get("/api/env", (_req: Request, res: Response) => {
    const payload = CollectEnvData.getInstance().collect();
    res.json(payload);
  });

  app.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query<{ name: string; version: string }>(
        "SELECT name, version FROM app_info WHERE name = $1 LIMIT 1",
        ["refactor"],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "refactor entry not found" });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
};

export const startServer = (port: number = Number(process.env.PORT) || 3000) => {
  const app = createApp();
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });

  server.on("close", () => {
    const pool: Pool | undefined = app.locals.pool;
    if (pool) {
      pool.end().catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Error closing Postgres pool", error);
      });
    }
  });

  return server;
};

if (require.main === module) {
  startServer();
}
