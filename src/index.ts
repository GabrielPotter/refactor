import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

import { createDatabase, type Database } from "./db/client";
import { DevSchema } from "./db/schema.dev";
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

const createPool = (): Pool => {
  return new Pool({
    host: process.env.PGHOST ?? process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.PGPORT ?? process.env.POSTGRES_PORT ?? 5432),
    user: process.env.PGUSER ?? process.env.POSTGRES_USER ?? "refactor",
    password: process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? "refactor",
    database: process.env.PGDATABASE ?? process.env.POSTGRES_DB ?? "refactor",
  });
};

type AppDependencies = {
  pool?: Pool;
  devSchema?: Pick<typeof DevSchema, "resetAll" | "createAll" | "dropAll">;
  devSchemaEnabled?: boolean;
  createDevDb?: () => Promise<{ db: Database; destroy: () => Promise<void> }>;
  db?: Database;
  appInfoRepository?: AppInfoRepository;
  jsonSchemasRepository?: JsonSchemasRepository;
  treeRepository?: TreeRepository;
  layerRepository?: LayerRepository;
  edgeCategoryRepository?: EdgeCategoryRepository;
  edgeRepository?: EdgeRepository;
  edgeTypeRepository?: EdgeTypeRepository;
  nodeCategoryRepository?: NodeCategoryRepository;
  nodeRepository?: NodeRepository;
  nodeTypeRepository?: NodeTypeRepository;
};

export const createApp = ({
  pool,
  devSchema,
  devSchemaEnabled,
  createDevDb,
  db,
  appInfoRepository,
  jsonSchemasRepository,
  treeRepository,
  layerRepository,
  edgeCategoryRepository,
  edgeRepository,
  edgeTypeRepository,
  nodeCategoryRepository,
  nodeRepository,
  nodeTypeRepository,
}: AppDependencies = {}) => {
  const app = express();
  CommandInterpreter.initialize(createServerExecutors());

  const dbPool = pool ?? createPool();
  const devSchemaApi = devSchema ?? DevSchema;
  const devApiEnabled =
    devSchemaEnabled ??
    (process.env.ENABLE_DEV_SCHEMA_API === "true" || process.env.NODE_ENV !== "production");

  const mainDb = db ?? createDatabase(dbPool);
  const ownsDb = !db;

  const appInfoRepo = appInfoRepository ?? new AppInfoRepository(mainDb);
  const schemasRepo = jsonSchemasRepository ?? new JsonSchemasRepository(mainDb);
  const treeRepo = treeRepository ?? new TreeRepository(mainDb);
  const layerRepo = layerRepository ?? new LayerRepository(mainDb);
  const edgeCategoryRepo = edgeCategoryRepository ?? new EdgeCategoryRepository(mainDb);
  const edgeRepoInstance = edgeRepository ?? new EdgeRepository(mainDb);
  const edgeTypeRepo = edgeTypeRepository ?? new EdgeTypeRepository(mainDb);
  const nodeCategoryRepo = nodeCategoryRepository ?? new NodeCategoryRepository(mainDb);
  const nodeRepoInstance = nodeRepository ?? new NodeRepository(mainDb);
  const nodeTypeRepo = nodeTypeRepository ?? new NodeTypeRepository(mainDb);

  const buildDevDb =
    createDevDb ??
    (async () => {
      const pool = createPool();
      const devDb = createDatabase(pool);
      return {
        db: devDb,
        destroy: () => pool.end(),
      };
    });

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

  const devSchemaActions: Array<{
    path: string;
    action: string;
    handler: (database: Database) => Promise<void>;
  }> = [
    { path: "/dev/schema/reset", action: "reset", handler: (database) => devSchemaApi.resetAll(database) },
    { path: "/dev/schema/create", action: "create", handler: (database) => devSchemaApi.createAll(database) },
    { path: "/dev/schema/drop", action: "drop", handler: (database) => devSchemaApi.dropAll(database) },
  ];

  const buildDevSchemaHandler = (handler: (database: Database) => Promise<void>, action: string) =>
    async (_req: Request, res: Response, next: NextFunction) => {
      let devDb: { db: Database; destroy: () => Promise<void> } | undefined;
      try {
        devDb = await buildDevDb();
        await handler(devDb.db);
        res.status(200).json({ status: "ok", action });
      } catch (error) {
        next(error);
      } finally {
        if (devDb) {
          await devDb.destroy().catch((destroyError) => {
            // eslint-disable-next-line no-console
            console.error("Error tearing down dev schema connection", destroyError);
          });
        }
      }
    };

  if (devApiEnabled) {
    for (const { path: routePath, action, handler } of devSchemaActions) {
      app.post(routePath, buildDevSchemaHandler(handler, action));
    }
  } else {
    const disabledHandler = (_req: Request, res: Response) => {
      res.status(403).json({ error: "Dev schema endpoints disabled" });
    };
    app.post(devSchemaActions.map(({ path: routePath }) => routePath), disabledHandler);
  }

  app.use("/api/app-info", createAppInfoRouter(appInfoRepo));
  app.use("/api/json-schemas", createJsonSchemasRouter(schemasRepo));
  app.use("/api/trees", createTreeRouter(treeRepo));
  app.use("/api/layers", createLayerRouter(layerRepo));
  app.use("/api/edge-categories", createEdgeCategoryRouter(edgeCategoryRepo));
  app.use("/api/edges", createEdgeRouter(edgeRepoInstance));
  app.use("/api/edge-types", createEdgeTypeRouter(edgeTypeRepo));
  app.use("/api/node-categories", createNodeCategoryRouter(nodeCategoryRepo));
  app.use("/api/nodes", createNodeRouter(nodeRepoInstance));
  app.use("/api/node-types", createNodeTypeRouter(nodeTypeRepo));
  app.use("/api/metrics", createMetricsRouter());
  app.use("/api/console", createConsoleRouter());

  app.get("/api/env", (_req: Request, res: Response) => {
    const payload = CollectEnvData.getInstance().collect();
    res.json(payload);
  });

  app.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dbPool.query<{ name: string; version: string }>(
        "SELECT name, version FROM app_info WHERE name = $1 LIMIT 1",
        ["refactor"]
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

  if (ownsDb) {
    app.locals.destroyDb = async () => {
      // Connection pool cleanup happens in startServer's shutdown handler.
    };
  }

  app.locals.repositories = {
    appInfo: appInfoRepo,
    jsonSchemas: schemasRepo,
    trees: treeRepo,
    layers: layerRepo,
    edgeCategories: edgeCategoryRepo,
    edges: edgeRepoInstance,
    edgeTypes: edgeTypeRepo,
    nodeCategories: nodeCategoryRepo,
    nodes: nodeRepoInstance,
    nodeTypes: nodeTypeRepo,
  };
  app.locals.db = mainDb;

  return app;
};

export const startServer = (port: number = Number(process.env.PORT) || 3000) => {
  const pool = createPool();
  const app = createApp({ pool });
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });

  server.on("close", () => {
    pool.end().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error closing Postgres pool", error);
    });
    if (typeof app.locals.destroyDb === "function") {
      app.locals.destroyDb().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Error during database cleanup", error);
      });
    }
  });

  return server;
};

if (require.main === module) {
  startServer();
}
