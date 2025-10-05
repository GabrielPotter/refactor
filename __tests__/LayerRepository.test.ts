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
import { LayerRepository } from "../src/repositories/LayerRepository";
import type { DB, Layer } from "../src/db/types";

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
  const repo = new LayerRepository(db);

  return { repo, db, queries };
};

const createLayerRow = (overrides: Partial<Layer> = {}): Layer => {
  const now = new Date();
  return {
    id: overrides.id ?? "layer-1",
    name: overrides.name ?? "Layer",
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe("LayerRepository", () => {
  it("lists layers ordered by creation time", async () => {
    const layerRow = createLayerRow();
    const { repo, db, queries } = createTestRepo([{ rows: [layerRow] }]);

    try {
      const result = await repo.listLayers();
      expect(result).toEqual([layerRow]);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain("select");
      expect(sql).toContain('from "layer"');
      expect(sql).toContain('order by "created_at" asc');
    } finally {
      await db.destroy();
    }
  });

  it("creates a layer", async () => {
    const layerRow = createLayerRow();
    const { repo, db, queries } = createTestRepo([{ rows: [layerRow] }]);

    try {
      const result = await repo.createLayer(layerRow.name);
      expect(result).toEqual(layerRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('insert into "layer"');
    } finally {
      await db.destroy();
    }
  });

  it("renames a layer", async () => {
    const layerRow = createLayerRow({ name: "Updated" });
    const { repo, db, queries } = createTestRepo([{ rows: [layerRow] }]);

    try {
      const result = await repo.renameLayer(layerRow.id, layerRow.name);
      expect(result).toEqual(layerRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('update "layer"');
    } finally {
      await db.destroy();
    }
  });

  it("retrieves a layer by id", async () => {
    const layerRow = createLayerRow();
    const { repo, db, queries } = createTestRepo([{ rows: [layerRow] }]);

    try {
      const result = await repo.getLayer(layerRow.id);
      expect(result).toEqual(layerRow);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('where "id" =');
    } finally {
      await db.destroy();
    }
  });

  it("deletes a layer", async () => {
    const { repo, db, queries } = createTestRepo([{ rows: [] }]);

    try {
      await repo.deleteLayer("layer-1");
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('delete from "layer"');
    } finally {
      await db.destroy();
    }
  });
});
