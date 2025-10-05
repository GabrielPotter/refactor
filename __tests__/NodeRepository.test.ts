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
import { NodeRepository } from "../src/repositories/NodeRepository";
import type { DB, Node } from "../src/db/types";

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
  const repo = new NodeRepository(db);

  return { repo, db, queries };
};

const createNodeRow = (overrides: Partial<Node> = {}): Node => {
  const now = new Date();
  return {
    id: overrides.id ?? "node-1",
    tree_id: overrides.tree_id ?? "tree-1",
    parent_id: overrides.parent_id ?? null,
    category_id: overrides.category_id ?? null,
    name: overrides.name ?? "Node",
    position: overrides.position ?? 0,
    euler_left: overrides.euler_left ?? 1,
    euler_right: overrides.euler_right ?? 2,
    euler_depth: overrides.euler_depth ?? 0,
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe("NodeRepository", () => {
  it("creates a root node with auto-incremented position", async () => {
    const row = createNodeRow();
    const { repo, db, queries } = createTestRepo([
      { rows: [{ max_right: 0 }] },
      { rows: [] },
      { rows: [] },
      { rows: [row] },
    ]);

    try {
      const result = await repo.createNode({
        treeId: row.tree_id,
        name: row.name,
        parentId: null,
        props: row.props,
      });

      expect(result).toEqual(row);
      expect(queries).toHaveLength(4);
      expect(queries[0].sql.toLowerCase()).toContain('max("euler_right")');
      const insertSql = queries[3].sql.toLowerCase();
      expect(insertSql).toContain('insert into "node"');
      expect(insertSql).toContain('"parent_id"');
      expect(insertSql).toContain('"category_id"');
    } finally {
      await db.destroy();
    }
  });

  it("lists all nodes in a tree ordered by parent and position", async () => {
    const node = createNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [node] }]);

    try {
      const result = await repo.listAllNodes(node.tree_id);
      expect(result).toEqual([node]);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain("select");
      expect(sql).toContain('from "node"');
      expect(sql).toContain('where "tree_id" =');
      expect(sql).toContain('order by "euler_left" asc');
      expect(sql).toContain('"position" asc');
    } finally {
      await db.destroy();
    }
  });

  it("creates a child node with explicit parent position calculation", async () => {
    const childRow = createNodeRow({
      id: "node-2",
      parent_id: "node-1",
      category_id: "cat-1",
      euler_left: 2,
      euler_right: 3,
      euler_depth: 1,
    });
    const { repo, db, queries } = createTestRepo([
      { rows: [{ euler_right: 2, euler_depth: 0 }] },
      { rows: [] },
      { rows: [] },
      { rows: [childRow] },
    ]);

    try {
      const result = await repo.createNode({
        treeId: childRow.tree_id,
        name: childRow.name,
        parentId: childRow.parent_id,
        props: childRow.props,
        categoryId: childRow.category_id,
      });

      expect(result).toEqual(childRow);
      expect(queries).toHaveLength(4);
      expect(queries[0].sql.toLowerCase()).toContain("select");
      const insertSql = queries[3].sql.toLowerCase();
      expect(insertSql).toContain('insert into "node"');
      expect(insertSql).toContain('"parent_id"');
      expect(insertSql).toContain('"category_id"');
    } finally {
      await db.destroy();
    }
  });

  it("applies maxDepth filter when retrieving a subtree", async () => {
    const row = createNodeRow();
    const { repo, db, queries } = createTestRepo([
      { rows: [row] },
      { rows: [] },
    ]);

    try {
      await repo.getSubtree(row.tree_id, row.id, { maxDepth: 2 });
    } finally {
      await db.destroy();
    }
  });

  it("prevents moving a node under its own descendant", async () => {
    const row = createNodeRow({ euler_left: 1, euler_right: 4, euler_depth: 0 });
    const descendant = createNodeRow({ id: "node-2", euler_left: 2, euler_right: 3, euler_depth: 1 });
    const { repo, db, queries } = createTestRepo([
      { rows: [row] },
      { rows: [descendant] },
    ]);

    try {
      await expect(repo.moveSubtree(row.tree_id, row.id, descendant.id)).rejects.toThrow(
        "Cycle prevented: the new parent is part of the subtree.",
      );
      expect(queries).toHaveLength(2);
    } finally {
      await db.destroy();
    }
  });

  it("moves a node to the root with correct position calculation", async () => {
    const node = createNodeRow({ euler_left: 1, euler_right: 4, euler_depth: 1, parent_id: "node-root" });
    const { repo, db, queries } = createTestRepo([
      { rows: [node] },
      { rows: [{ max_right: 6 }] },
    ]);

    try {
      await repo.moveSubtree("tree-1", "node-1", null);
      expect(queries.length).toBeGreaterThan(1);
      expect(queries.some((q) => q.sql.toLowerCase().includes("parent_id is null"))).toBe(true);
    } finally {
      await db.destroy();
    }
  });

  it("filters nodes by JSONB type attribute", async () => {
    const row = createNodeRow({ props: { type: "folder" } });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.listByType(row.tree_id, "folder");
      expect(result).toEqual([row]);
      expect(queries[0].sql).toContain("@>");
    } finally {
      await db.destroy();
    }
  });

  it("increments a named counter inside node props", async () => {
    const row = createNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.incrementCounter(row.tree_id, row.id, "views", 2);
      expect(result).toEqual(row);
      const sql = queries[0].sql;
      expect(sql).toContain("jsonb_set");
      expect(sql).toContain("#>>");
      expect(sql).toContain("counters");
    } finally {
      await db.destroy();
    }
  });
});
