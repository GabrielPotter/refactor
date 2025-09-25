import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import type {
  CompiledQuery,
  DatabaseConnection,
  Dialect,
  Driver,
  QueryResult,
} from "kysely";
import { EdgeRepository } from "../repositories/EdgeRepository";
import type { DB, Edge } from "../db/types";

class MockConnection implements DatabaseConnection {
  constructor(
    private readonly responses: QueryResult<any>[],
    private readonly queries: CompiledQuery[],
  ) {}

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    this.queries.push(compiledQuery);
    const response = this.responses.shift() ?? { rows: [] };
    return response as QueryResult<R>;
  }

  async *streamQuery() {
    throw new Error("Streaming not implemented in MockConnection");
  }
}

class MockDriver implements Driver {
  private readonly queue: QueryResult<any>[];

  constructor(responses: QueryResult<any>[], private readonly queries: CompiledQuery[]) {
    this.queue = [...responses];
  }

  async init() {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new MockConnection(this.queue, this.queries);
  }

  async beginTransaction() {}
  async commitTransaction() {}
  async rollbackTransaction() {}
  async releaseConnection() {}
  async destroy() {}
  async savepoint() {}
  async releaseSavepoint() {}
  async rollbackToSavepoint() {}
}

const createTestRepo = (responses: QueryResult<any>[]) => {
  const queries: CompiledQuery[] = [];

  const dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new MockDriver(responses, queries),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  };

  const db = new Kysely<DB>({ dialect });
  const repo = new EdgeRepository(db);

  return { repo, db, queries };
};

const createEdgeRow = (overrides: Partial<Edge> = {}): Edge => {
  const now = new Date();
  return {
    id: overrides.id ?? "edge-1",
    layer_id: overrides.layer_id ?? "layer-1",
    name: overrides.name ?? "Edge",
    from: overrides.from ?? "node-1",
    to: overrides.to ?? "node-2",
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe("EdgeRepository", () => {
  it("lists edges ordered by creation time", async () => {
    const edgeRow = createEdgeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [edgeRow] }]);

    try {
      const result = await repo.listEdges();
      expect(result).toEqual([edgeRow]);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain("select");
      expect(sql).toContain('from "edge"');
      expect(sql).toContain('order by "created_at" asc');
    } finally {
      await db.destroy();
    }
  });

  it("lists edges by layer", async () => {
    const edgeRow = createEdgeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [edgeRow] }]);

    try {
      const result = await repo.listEdgesByLayer(edgeRow.layer_id);
      expect(result).toEqual([edgeRow]);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('where "layer_id" =');
    } finally {
      await db.destroy();
    }
  });

  it("creates an edge", async () => {
    const edgeRow = createEdgeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [edgeRow] }]);

    try {
      const result = await repo.createEdge({
        layerId: edgeRow.layer_id,
        name: edgeRow.name,
        from: edgeRow.from,
        to: edgeRow.to,
        props: edgeRow.props,
      });
      expect(result).toEqual(edgeRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('insert into "edge"');
    } finally {
      await db.destroy();
    }
  });

  it("updates an edge", async () => {
    const edgeRow = createEdgeRow({ name: "Updated" });
    const { repo, db, queries } = createTestRepo([{ rows: [edgeRow] }]);

    try {
      const result = await repo.updateEdge(edgeRow.id, { name: edgeRow.name });
      expect(result).toEqual(edgeRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('update "edge"');
    } finally {
      await db.destroy();
    }
  });

  it("retrieves an edge by id", async () => {
    const edgeRow = createEdgeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [edgeRow] }]);

    try {
      const result = await repo.getEdge(edgeRow.id);
      expect(result).toEqual(edgeRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('where "id" =');
    } finally {
      await db.destroy();
    }
  });

  it("deletes an edge", async () => {
    const { repo, db, queries } = createTestRepo([{ rows: [] }]);

    try {
      await repo.deleteEdge("edge-1");
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('delete from "edge"');
    } finally {
      await db.destroy();
    }
  });
});
