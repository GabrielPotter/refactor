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
import { TreeRepository } from '../src/repositories/TreeRepository';
import type { DB, Tree } from '../src/db/types';

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

const createRepo = <T>(
  RepositoryCtor: new (db: Kysely<DB>) => T,
  responses: QueryResult<any>[]
) => {
  const queries: CompiledQuery[] = [];

  const dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new MockDriver(responses, queries),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  };

  const db = new Kysely<DB>({ dialect });
  const repo = new RepositoryCtor(db);

  return { repo, db, queries };
};

const createTestRepo = (responses: QueryResult<any>[]) => createRepo(TreeRepository, responses);

const createTreeRow = (overrides: Partial<Tree> = {}): Tree => {
  const now = new Date();
  return {
    id: overrides.id ?? 'tree-1',
    name: overrides.name ?? 'Tree',
    props: overrides.props ?? {},
    props_schema: overrides.props_schema ?? 'schema-1',
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};
describe('TreeRepository', () => {
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

  it('creates a tree with the provided name', async () => {
    const treeRow = createTreeRow({ name: 'New Tree', props_schema: 'schema-123' });
    const { repo, db, queries } = createTestRepo([
      { rows: [{ id: treeRow.props_schema, name: `${treeRow.name}-props-schema`, schema: {} }] },
      { rows: [treeRow] },
    ]);

    try {
      const result = await repo.createTree(treeRow.name);
      expect(result).toEqual(treeRow);
      expect(queries).toHaveLength(2);
      expect(queries[0].sql.toLowerCase()).toContain('select');
      expect(queries[0].sql.toLowerCase()).toContain('from "json_schemas"');
      expect(queries[1].sql.toLowerCase()).toContain('insert into "tree"');
    } finally {
      await db.destroy();
    }
  });
});
