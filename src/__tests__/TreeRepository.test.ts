import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import type {
  CompiledQuery,
  DatabaseConnection,
  Dialect,
  Driver,
  QueryResult,
} from 'kysely';
import { TreeRepository } from '../repositories/TreeRepository';
import type { DB, Tree, TreeNode } from '../db/types';

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
    throw new Error('Streaming not implemented in MockConnection');
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
  const repo = new TreeRepository(db);

  return { repo, db, queries };
};

const createTreeNodeRow = (overrides: Partial<TreeNode> = {}): TreeNode => {
  const now = new Date();
  return {
    id: overrides.id ?? 'node-1',
    tree_id: overrides.tree_id ?? 'tree-1',
    parent_id: overrides.parent_id ?? null,
    name: overrides.name ?? 'Node',
    position: overrides.position ?? 0,
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

const createTreeRow = (overrides: Partial<Tree> = {}): Tree => {
  const now = new Date();
  return {
    id: overrides.id ?? 'tree-1',
    name: overrides.name ?? 'Tree',
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe('TreeRepository', () => {
  it('creates a root node with auto-incremented position', async () => {
    const row = createTreeNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.createNode({
        treeId: row.tree_id,
        name: row.name,
        parentId: null,
        props: row.props,
      });

      expect(result).toEqual(row);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('insert into "tree_node"');
      expect(sql).toContain('parent_id is null');
    } finally {
      await db.destroy();
    }
  });

  it('lists trees ordered by creation time', async () => {
    const treeRow = createTreeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [treeRow] }]);

    try {
      const result = await repo.listTrees();
      expect(result).toEqual([treeRow]);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('select');
      expect(queries[0].sql.toLowerCase()).toContain('from "tree"');
      expect(queries[0].sql.toLowerCase()).toContain('order by "created_at" asc');
    } finally {
      await db.destroy();
    }
  });

  it('lists all nodes in a tree ordered by parent and position', async () => {
    const node = createTreeNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [node] }]);

    try {
      const result = await repo.listAllNodes(node.tree_id);
      expect(result).toEqual([node]);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('select');
      expect(sql).toContain('from "tree_node"');
      expect(sql).toContain('where "tree_id" =');
      expect(sql).toContain('order by "parent_id" asc');
      expect(sql).toContain('"position" asc');
    } finally {
      await db.destroy();
    }
  });

  it('creates a child node with explicit parent position calculation', async () => {
    const childRow = createTreeNodeRow({ id: 'node-2', parent_id: 'node-1' });
    const { repo, db, queries } = createTestRepo([{ rows: [childRow] }]);

    try {
      const result = await repo.createNode({
        treeId: childRow.tree_id,
        name: childRow.name,
        parentId: childRow.parent_id,
        props: childRow.props,
      });

      expect(result).toEqual(childRow);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('insert into "tree_node"');
      expect(sql).toContain('parent_id=$');
    } finally {
      await db.destroy();
    }
  });

  it('applies maxDepth filter when retrieving a subtree', async () => {
    const row = createTreeNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      await repo.getSubtree(row.tree_id, row.id, { maxDepth: 2 });

      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toContain('"s"."depth" < $');
    } finally {
      await db.destroy();
    }
  });

  it('prevents moving a node under its own descendant', async () => {
    const row = createTreeNodeRow();
    const descendant = createTreeNodeRow({ id: 'node-2' });
    const { repo, db, queries } = createTestRepo([{ rows: [row, descendant] }]);

    try {
      await expect(repo.moveSubtree(row.tree_id, row.id, descendant.id)).rejects.toThrow(
        'Ciklus tiltva: az új szülő a részfa része.',
      );
      expect(queries).toHaveLength(1);
    } finally {
      await db.destroy();
    }
  });

  it('moves a node to the root with correct position calculation', async () => {
    const { repo, db, queries } = createTestRepo([
      { rows: [], numAffectedRows: BigInt(1) },
    ]);

    try {
      await repo.moveSubtree('tree-1', 'node-1', null);
      expect(queries).toHaveLength(1);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('parent_id is null');
    } finally {
      await db.destroy();
    }
  });

  it('filters nodes by JSONB type attribute', async () => {
    const row = createTreeNodeRow({ props: { type: 'folder' } });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.listByType(row.tree_id, 'folder');
      expect(result).toEqual([row]);
      expect(queries[0].sql).toContain('@>');
    } finally {
      await db.destroy();
    }
  });

  it('increments a named counter inside node props', async () => {
    const row = createTreeNodeRow();
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.incrementCounter(row.tree_id, row.id, 'views', 2);
      expect(result).toEqual(row);
      const sql = queries[0].sql;
      expect(sql).toContain('jsonb_set');
      expect(sql).toContain('#>>');
      expect(sql).toContain('counters');
    } finally {
      await db.destroy();
    }
  });
});
