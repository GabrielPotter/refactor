import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { DevSchema } from "./db/schema.dev";
import type { DB } from "./db/types";
import { TreeRepository } from "./repositories/TreeRepository";
import { LayerRepository } from "./repositories/LayerRepository";
import { EdgeRepository } from "./repositories/EdgeRepository";
import { NodeRepository } from "./repositories/NodeRepository";
import { CategoryRepository } from "./repositories/CategoryRepository";
import { mountSwagger } from "./swagger";
import { createTreeRouter, type TreeRepositoryContract } from "./routes/treeRouter";
import { createNodeRouter, type NodeRepositoryContract } from "./routes/nodeRouter";
import { createCategoryRouter, type CategoryRepositoryContract } from "./routes/categoryRouter";
import { createLayerRouter, type LayerRepositoryContract } from "./routes/layerRouter";
import { createEdgeRouter, type EdgeRepositoryContract } from "./routes/edgeRouter";
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
    createDevDb?: () => Promise<{ db: Kysely<DB>; destroy: () => Promise<void> }>;
    db?: Kysely<DB>;
    treeRepository?: TreeRepositoryContract;
    createTreeRepository?: (db: Kysely<DB>) => TreeRepositoryContract;
    nodeRepository?: NodeRepositoryContract;
    createNodeRepository?: (db: Kysely<DB>) => NodeRepositoryContract;
    categoryRepository?: CategoryRepositoryContract;
    createCategoryRepository?: (db: Kysely<DB>) => CategoryRepositoryContract;
    layerRepository?: LayerRepositoryContract;
    createLayerRepository?: (db: Kysely<DB>) => LayerRepositoryContract;
    edgeRepository?: EdgeRepositoryContract;
    createEdgeRepository?: (db: Kysely<DB>) => EdgeRepositoryContract;
};

export const createApp = ({
    pool,
    devSchema,
    devSchemaEnabled,
    createDevDb,
    db,
    treeRepository,
    createTreeRepository,
    nodeRepository,
    createNodeRepository,
    categoryRepository,
    createCategoryRepository,
    layerRepository,
    createLayerRepository,
    edgeRepository,
    createEdgeRepository,
}: AppDependencies = {}) => {
    const app = express();
    CommandInterpreter.initialize(createServerExecutors());
    const dbPool = pool ?? createPool();
    const devSchemaApi = devSchema ?? DevSchema;
    const devApiEnabled =
        devSchemaEnabled ?? (process.env.ENABLE_DEV_SCHEMA_API === "true" || process.env.NODE_ENV !== "production");

    const mainDb =
        db ??
        new Kysely<DB>({
            dialect: new PostgresDialect({
                pool: dbPool,
            }),
        });
    const shouldDestroyDb = !db;

    const treeRepoFactory =
        createTreeRepository ?? ((database: Kysely<DB>): TreeRepositoryContract => new TreeRepository(database));
    const treeRepo = treeRepository ?? treeRepoFactory(mainDb);

    const nodeRepoFactory =
        createNodeRepository ?? ((database: Kysely<DB>): NodeRepositoryContract => new NodeRepository(database));
    const nodeRepo = nodeRepository ?? nodeRepoFactory(mainDb);

    const categoryRepoFactory =
        createCategoryRepository ??
        ((database: Kysely<DB>): CategoryRepositoryContract => new CategoryRepository(database));
    const categoryRepo = categoryRepository ?? categoryRepoFactory(mainDb);

    const layerRepoFactory =
        createLayerRepository ?? ((database: Kysely<DB>): LayerRepositoryContract => new LayerRepository(database));
    const layerRepo = layerRepository ?? layerRepoFactory(mainDb);

    const edgeRepoFactory =
        createEdgeRepository ?? ((database: Kysely<DB>): EdgeRepositoryContract => new EdgeRepository(database));
    const edgeRepo = edgeRepository ?? edgeRepoFactory(mainDb);

    const buildDevDb =
        createDevDb ??
        (async () => {
            const dialect = new PostgresDialect({
                pool: createPool(),
            });
            const devDb = new Kysely<DB>({ dialect });
            return {
                db: devDb,
                destroy: () => devDb.destroy(),
            };
        });

    app.use(express.json());
    //measured endpoints
    ParamGrouping.addRule({ method: "GET", path: "/api1/tree/", keep: [] });
    ParamGrouping.addRule({ method: "POST", path: "/api1/tree/", keep: [] });
    app.use(latencyCollector());
    mountSwagger(app);

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
        handler: (database: Kysely<DB>) => Promise<void>;
    }> = [
        {
            path: "/dev/schema/reset",
            action: "reset",
            handler: (database) => devSchemaApi.resetAll(database),
        },
        {
            path: "/dev/schema/create",
            action: "create",
            handler: (database) => devSchemaApi.createAll(database),
        },
        {
            path: "/dev/schema/drop",
            action: "drop",
            handler: (database) => devSchemaApi.dropAll(database),
        },
    ];

    if (devApiEnabled) {
        for (const { path: routePath, action, handler } of devSchemaActions) {
            app.post(routePath, async (_req: Request, res: Response, next: NextFunction) => {
                let devDb: { db: Kysely<DB>; destroy: () => Promise<void> } | undefined;
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
            });
        }
    } else {
        const disabledHandler = (_req: Request, res: Response) => {
            res.status(403).json({ error: "Dev schema endpoints disabled" });
        };
        app.post(
            devSchemaActions.map(({ path: routePath }) => routePath),
            disabledHandler
        );
    }

    app.use("/api1/tree", createTreeRouter(treeRepo));
    app.use("/api1/node/:treeId", createNodeRouter(nodeRepo));
    app.use("/api1/node-categories", createCategoryRouter(categoryRepo));
   app.use("/api1/metrics", createMetricsRouter());
   app.use("/api1/edge", createEdgeRouter(edgeRepo));
   app.use("/api1/layer", createLayerRouter(layerRepo));
    app.use("/api2/console", createConsoleRouter());
    app.get("/api1/env", (_req: Request, res: Response) => {
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

    app.get("/api1", (_req: Request, res: Response) => {
        res.json({ endpoint: "api1" });
    });

    app.get("/api2", (_req: Request, res: Response) => {
        res.json({ endpoint: "api2" });
    });

    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        // eslint-disable-next-line no-console
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    });

    if (shouldDestroyDb) {
        app.locals.destroyTreeDb = async () => {
            await mainDb.destroy();
        };
    }

    app.locals.treeRepository = treeRepo;
    app.locals.layerRepository = layerRepo;
    app.locals.edgeRepository = edgeRepo;
    app.locals.treeDb = mainDb;

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
        if (typeof app.locals.destroyTreeDb === "function") {
            app.locals.destroyTreeDb().catch((error: unknown) => {
                // eslint-disable-next-line no-console
                console.error("Error destroying Kysely instance", error);
            });
        }
    });

    return server;
};

if (require.main === module) {
    startServer();
}
