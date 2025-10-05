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
import { CategoryRepository } from '../src/repositories/CategoryRepository';
import type { DB, NodeCategory } from '../src/db/types';

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
  const repo = new CategoryRepository(db);

  return { repo, db, queries };
};

const createCategoryRow = (overrides: Partial<NodeCategory> = {}): NodeCategory => {
  const now = new Date();
  return {
    id: overrides.id ?? 'category-1',
    parent_id: overrides.parent_id ?? null,
    name: overrides.name ?? 'Category',
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe('CategoryRepository', () => {
  it('lists all categories ordered by name', async () => {
    const row = createCategoryRow();
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.listCategories();
      expect(result).toEqual([row]);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('from "node_categories"');
      expect(queries[0].sql.toLowerCase()).toContain('order by "name" asc');
    } finally {
      await db.destroy();
    }
  });

  it('filters categories by parent', async () => {
    const row = createCategoryRow({ parent_id: 'category-root' });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.listCategories('category-root');
      expect(result).toEqual([row]);
      expect(queries[0].sql.toLowerCase()).toContain('where "parent_id" =');
    } finally {
      await db.destroy();
    }
  });

  it('filters root categories when parentId is null', async () => {
    const row = createCategoryRow({ parent_id: null });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.listCategories(null);
      expect(result).toEqual([row]);
      const sql = queries[0].sql.toLowerCase();
      expect(sql).toContain('where "parent_id" is null');
    } finally {
      await db.destroy();
    }
  });

  it('creates a category', async () => {
    const row = createCategoryRow({ name: 'Folder' });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.createCategory({ name: 'Folder', parentId: null, props: row.props });
      expect(result).toEqual(row);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('insert into "node_categories"');
    } finally {
      await db.destroy();
    }
  });

  it('updates a category including parent change', async () => {
    const row = createCategoryRow({ parent_id: 'category-root', name: 'Updated' });
    const { repo, db, queries } = createTestRepo([{ rows: [row] }]);

    try {
      const result = await repo.updateCategory('category-1', { name: 'Updated', parentId: 'category-root' });
      expect(result).toEqual(row);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('update "node_categories"');
      expect(queries[0].sql.toLowerCase()).toContain('returning');
    } finally {
      await db.destroy();
    }
  });

  it('prevents assigning a category as its own parent', async () => {
    const { repo, db } = createTestRepo([]);

    await expect(repo.updateCategory('category-1', { parentId: 'category-1' })).rejects.toThrow(
      'A category cannot be its own parent.'
    );

    await db.destroy();
  });

  it('deletes a category', async () => {
    const { repo, db, queries } = createTestRepo([{ rows: [] }]);

    try {
      await repo.deleteCategory('category-1');
      expect(queries).toHaveLength(1);
      expect(queries[0].sql.toLowerCase()).toContain('delete from "node_categories"');
    } finally {
      await db.destroy();
    }
  });
});
