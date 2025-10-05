import { EventEmitter } from 'events';
import { createRequest, createResponse } from 'node-mocks-http';
import type { Pool } from 'pg';
import type { Kysely } from 'kysely';
import { createApp } from '../src/index';
import type { DB, Tree, TreeNode, Layer, Edge, NodeCategory } from '../src/db/types';
import type { TreeRepository } from '../src/repositories/TreeRepository';
import type { NodeRepository } from '../src/repositories/NodeRepository';
import type { CategoryRepository } from '../src/repositories/CategoryRepository';
import type { LayerRepository } from '../src/repositories/LayerRepository';
import type { EdgeRepository } from '../src/repositories/EdgeRepository';
import { LatencyStats } from '../src/metrics/latencyStats';

type QueryRow = { name: string; version: string };

type ExpressHandler = {
  handle: (req: unknown, res: unknown) => void;
};

type RequestOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, unknown>;
};

const performRequest = async (app: ReturnType<typeof createApp>, options: string | RequestOptions) => {
  const { url, method = 'GET', body, query } =
    typeof options === 'string' ? { url: options } : options;
  const handler = app as unknown as ExpressHandler;
  const req = createRequest({
    method,
    url,
    body: body as any,
    query: query as any,
    headers: { 'content-type': 'application/json' }
  });
  const res = createResponse({ eventEmitter: EventEmitter });

  await new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('error', reject);
    handler.handle(req, res);
  });

  const isJson = res.getHeader('content-type')?.toString().includes('application/json');
  return {
    status: res.statusCode,
    body: isJson ? res._getJSONData() : res._getData()
  };
};

const createMockPool = (rows: QueryRow[]) => {
  const query = jest.fn().mockResolvedValue({ rows });
  return { pool: { query } as unknown as Pool, query };
};

const createDevDbFactory = () => {
  const destroy = jest.fn().mockResolvedValue(undefined);
  const db = {} as unknown as Kysely<DB>;
  const factory = jest.fn().mockResolvedValue({ db, destroy });
  return { factory, db, destroy };
};

const createMockTreeRepo = () => {
  const repo: jest.Mocked<
    Pick<TreeRepository, 'createTree' | 'listTrees' | 'renameTree' | 'deleteTree'>
  > = {
    createTree: jest.fn(),
    listTrees: jest.fn(),
    renameTree: jest.fn(),
    deleteTree: jest.fn(),
  };
  return repo;
};

const createMockNodeRepo = () => {
  const repo: jest.Mocked<
    Pick<
      NodeRepository,
      | 'listAllNodes'
      | 'createNode'
      | 'getNode'
      | 'listChildren'
      | 'updateNode'
      | 'getPathToRoot'
      | 'getSubtree'
      | 'moveSubtree'
      | 'deleteSubtree'
      | 'listByType'
      | 'incrementCounter'
    >
  > = {
    listAllNodes: jest.fn(),
    createNode: jest.fn(),
    getNode: jest.fn(),
    listChildren: jest.fn(),
    updateNode: jest.fn(),
    getPathToRoot: jest.fn(),
    getSubtree: jest.fn(),
    moveSubtree: jest.fn(),
    deleteSubtree: jest.fn(),
    listByType: jest.fn(),
    incrementCounter: jest.fn(),
  };
  return repo;
};

const createMockCategoryRepo = () => {
  const repo: jest.Mocked<
    Pick<
      CategoryRepository,
      'listCategories' | 'createCategory' | 'getCategoryById' | 'getCategoryByName' | 'updateCategory' | 'deleteCategory'
    >
  > = {
    listCategories: jest.fn(),
    createCategory: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryByName: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };
  return repo;
};

const createMockLayerRepo = () => {
  const repo: jest.Mocked<
    Pick<LayerRepository, 'listLayers' | 'getLayer' | 'createLayer' | 'renameLayer' | 'deleteLayer'>
  > = {
    listLayers: jest.fn(),
    getLayer: jest.fn(),
    createLayer: jest.fn(),
    renameLayer: jest.fn(),
    deleteLayer: jest.fn(),
  };
  return repo;
};

const createMockEdgeRepo = () => {
  const repo: jest.Mocked<
    Pick<
      EdgeRepository,
      'listEdges' | 'listEdgesByLayer' | 'getEdge' | 'createEdge' | 'updateEdge' | 'deleteEdge'
    >
  > = {
    listEdges: jest.fn(),
    listEdgesByLayer: jest.fn(),
    getEdge: jest.fn(),
    createEdge: jest.fn(),
    updateEdge: jest.fn(),
    deleteEdge: jest.fn(),
  };
  return repo;
};

const createTreeRow = (overrides: Partial<Tree> = {}): Tree => {
  const now = new Date();
  return {
    id: overrides.id ?? 'tree-1',
    name: overrides.name ?? 'Tree',
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now
  };
};

const createLayerRow = (overrides: Partial<Layer> = {}): Layer => {
  const now = new Date();
  return {
    id: overrides.id ?? 'layer-1',
    name: overrides.name ?? 'Layer',
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now
  };
};

const createEdgeRow = (overrides: Partial<Edge> = {}): Edge => {
  const now = new Date();
  return {
    id: overrides.id ?? 'edge-1',
    layer_id: overrides.layer_id ?? 'layer-1',
    name: overrides.name ?? 'Edge',
    from: overrides.from ?? 'node-1',
    to: overrides.to ?? 'node-2',
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now
  };
};

const createNodeRow = (overrides: Partial<TreeNode> = {}): TreeNode => {
  const now = new Date();
  return {
    id: overrides.id ?? 'node-1',
    tree_id: overrides.tree_id ?? 'tree-1',
    parent_id: overrides.parent_id ?? null,
    category_id: overrides.category_id ?? null,
    name: overrides.name ?? 'Node',
    position: overrides.position ?? 0,
    euler_left: overrides.euler_left ?? 1,
    euler_right: overrides.euler_right ?? 2,
    euler_depth: overrides.euler_depth ?? 0,
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now
  };
};

const createCategoryRow = (overrides: Partial<NodeCategory> = {}): NodeCategory => {
  const now = new Date();
  return {
    id: overrides.id ?? 'cat-1',
    parent_id: overrides.parent_id ?? null,
    name: overrides.name ?? 'Category',
    props: overrides.props ?? {},
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

const serializeTree = (tree: Tree) => ({
  ...tree,
  created_at: tree.created_at.toISOString(),
  updated_at: tree.updated_at.toISOString()
});

const serializeLayer = (layer: Layer) => ({
  ...layer,
  created_at: layer.created_at.toISOString(),
  updated_at: layer.updated_at.toISOString()
});

const serializeEdge = (edge: Edge) => ({
  ...edge,
  created_at: edge.created_at.toISOString(),
  updated_at: edge.updated_at.toISOString()
});

const serializeCategory = (category: NodeCategory) => ({
  ...category,
  created_at: category.created_at.toISOString(),
  updated_at: category.updated_at.toISOString()
});

const serializeNode = (node: TreeNode) => ({
  ...node,
  created_at: node.created_at.toISOString(),
  updated_at: node.updated_at.toISOString()
});

describe('REST server endpoints', () => {
  it('responds to / with the refactor row from the database', async () => {
    const mockRows = [{ name: 'refactor', version: '1.0.0' }];
    const { pool, query } = createMockPool(mockRows);
    const app = createApp({
      pool,
      layerRepository: createMockLayerRepo(),
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockRows[0]);
    expect(query).toHaveBeenCalledWith(
      'SELECT name, version FROM app_info WHERE name = $1 LIMIT 1',
      ['refactor']
    );
  });

  it('returns 404 when the refactor row is missing', async () => {
    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      layerRepository: createMockLayerRepo(),
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'refactor entry not found' });
  });

  it('responds to /api1 with expected payload', async () => {
    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      layerRepository: createMockLayerRepo(),
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ endpoint: 'api1' });
  });

  it('responds to /api2 with expected payload', async () => {
    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      layerRepository: createMockLayerRepo(),
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ endpoint: 'api2' });
  });

  it('exposes Swagger spec at /swagger.json', async () => {
    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      layerRepository: createMockLayerRepo(),
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/swagger.json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      openapi: '3.0.0',
      info: { title: 'Refactor API' },
      paths: expect.objectContaining({
        '/': expect.any(Object),
        '/api1': expect.any(Object),
        '/api2': expect.any(Object),
        '/api1/tree': expect.any(Object),
        '/api1/node/{treeId}': expect.any(Object),
        '/api1/node/{treeId}/all': expect.any(Object),
        '/api1/node/{treeId}/item/{nodeId}': expect.any(Object),
        '/api1/metrics': expect.any(Object),
        '/api1/metrics/reset': expect.any(Object),
        '/api1/node-categories': expect.any(Object),
        '/api1/node-categories/{categoryId}': expect.any(Object),
        '/api1/layer': expect.any(Object),
        '/api1/layer/{layerId}': expect.any(Object),
        '/api1/edge': expect.any(Object),
        '/api1/edge/{layerId}': expect.any(Object),
        '/api1/edge/item/{edgeId}': expect.any(Object),
        '/dev/schema/reset': expect.any(Object),
        '/dev/schema/create': expect.any(Object),
        '/dev/schema/drop': expect.any(Object)
      })
    });
  });
});

describe('Dev schema endpoints', () => {
  it('returns 403 when disabled', async () => {
    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      devSchemaEnabled: false,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo(),
    });

    const response = await performRequest(app, { url: '/dev/schema/reset', method: 'POST' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Dev schema endpoints disabled' });
  });

  const routes = [
    { path: '/dev/schema/reset', action: 'reset', method: 'resetAll' as const },
    { path: '/dev/schema/create', action: 'create', method: 'createAll' as const },
    { path: '/dev/schema/drop', action: 'drop', method: 'dropAll' as const }
  ];

  for (const { path, action, method } of routes) {
    it(`executes ${action} action when enabled`, async () => {
      const { pool } = createMockPool([]);
      const schema = {
        resetAll: jest.fn().mockResolvedValue(undefined),
        createAll: jest.fn().mockResolvedValue(undefined),
        dropAll: jest.fn().mockResolvedValue(undefined)
      };
      const { factory, db, destroy } = createDevDbFactory();

    const app = createApp({
      pool,
      devSchemaEnabled: true,
      devSchema: schema,
      createDevDb: factory,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo(),
    });

      const response = await performRequest(app, { url: path, method: 'POST' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', action });

      expect(factory).toHaveBeenCalledTimes(1);
      expect(schema[method]).toHaveBeenCalledWith(db);

      for (const other of ['resetAll', 'createAll', 'dropAll'] as const) {
        if (other !== method) {
          expect(schema[other]).not.toHaveBeenCalled();
        }
      }

      expect(destroy).toHaveBeenCalledTimes(1);
    });
  }
});

describe('Tree repository endpoints', () => {
  it('lists trees', async () => {
    const { pool } = createMockPool([]);
    const repo = createMockTreeRepo();
    const tree = createTreeRow();
    repo.listTrees.mockResolvedValue([tree]);
    const app = createApp({
      pool,
      treeRepository: repo,
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/tree');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeTree(tree)]);
    expect(repo.listTrees).toHaveBeenCalledTimes(1);
  });

  it('lists all nodes in a tree', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    const node = createNodeRow();
    nodeRepo.listAllNodes.mockResolvedValue([node]);
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node/tree-1/all');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeNode(node)]);
    expect(nodeRepo.listAllNodes).toHaveBeenCalledWith('tree-1');
  });

  it('creates a tree', async () => {
    const { pool } = createMockPool([]);
    const repo = createMockTreeRepo();
    const tree = createTreeRow();
    repo.createTree.mockResolvedValue(tree);
    const app = createApp({
      pool,
      treeRepository: repo,
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/tree',
      method: 'POST',
      body: { name: '  Tree  ' }
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(serializeTree(tree));
    expect(repo.createTree).toHaveBeenCalledWith('Tree');
  });

  it('validates tree creation input', async () => {
    const { pool } = createMockPool([]);
    const repo = createMockTreeRepo();
    const app = createApp({
      pool,
      treeRepository: repo,
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/tree',
      method: 'POST',
      body: {}
    });

    expect(response.status).toBe(400);
    expect(repo.createTree).not.toHaveBeenCalled();
  });

  it('renames and deletes a tree', async () => {
    const { pool } = createMockPool([]);
    const repo = createMockTreeRepo();
    const tree = createTreeRow({ name: 'Renamed' });
    repo.renameTree.mockResolvedValue(tree);
    const app = createApp({
      pool,
      treeRepository: repo,
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const renameResponse = await performRequest(app, {
      url: '/api1/tree/tree-1',
      method: 'PUT',
      body: { name: 'Renamed' }
    });

    expect(renameResponse.status).toBe(200);
    expect(renameResponse.body).toEqual(serializeTree(tree));
    expect(repo.renameTree).toHaveBeenCalledWith('tree-1', 'Renamed');

    const deleteResponse = await performRequest(app, {
      url: '/api1/tree/tree-1',
      method: 'DELETE'
    });

    expect(deleteResponse.status).toBe(204);
    expect(repo.deleteTree).toHaveBeenCalledWith('tree-1');
  });

  it('handles node CRUD operations', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    const node = createNodeRow();
    nodeRepo.createNode.mockResolvedValue(node);
    nodeRepo.getNode.mockResolvedValue(node);
    nodeRepo.updateNode.mockResolvedValue({ ...node, name: 'Updated' });
    nodeRepo.listChildren.mockResolvedValue([node]);
    nodeRepo.deleteSubtree.mockResolvedValue();
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const createResponse = await performRequest(app, {
      url: '/api1/node/tree-1',
      method: 'POST',
      body: { name: 'Node', parentId: null }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual(serializeNode(node));
    expect(nodeRepo.createNode).toHaveBeenCalledWith({
      treeId: 'tree-1',
      name: 'Node',
      parentId: null,
      position: undefined,
      props: undefined,
      categoryId: undefined
    });

    const getResponse = await performRequest(app, '/api1/node/tree-1/item/node-1');
    expect(getResponse.status).toBe(200);
    expect(nodeRepo.getNode).toHaveBeenCalledWith('tree-1', 'node-1');

    const listResponse = await performRequest(app, {
      url: '/api1/node/tree-1'
    });
    expect(listResponse.status).toBe(200);
    expect(nodeRepo.listChildren).toHaveBeenCalledWith('tree-1', null);

    const updateResponse = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1',
      method: 'PATCH',
      body: { name: 'Updated' }
    });
    expect(updateResponse.status).toBe(200);
    expect(nodeRepo.updateNode).toHaveBeenCalledWith('tree-1', 'node-1', { name: 'Updated' });

    const deleteResponse = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1',
      method: 'DELETE'
    });
    expect(deleteResponse.status).toBe(204);
    expect(nodeRepo.deleteSubtree).toHaveBeenCalledWith('tree-1', 'node-1');
  });

  it('returns 404 when node not found', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    nodeRepo.getNode.mockResolvedValue(undefined);
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node/tree-1/item/node-404');

    expect(response.status).toBe(404);
  });

  it('moves subtree and handles advanced queries', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    const node = createNodeRow();
    nodeRepo.getPathToRoot.mockResolvedValue([{ ...node, depth: 0 }]);
    nodeRepo.getSubtree.mockResolvedValue([{ ...node, depth: 0 }]);
    nodeRepo.moveSubtree.mockResolvedValue();
    nodeRepo.listByType.mockResolvedValue([node]);
    nodeRepo.incrementCounter.mockResolvedValue(node);
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const pathResponse = await performRequest(app, '/api1/node/tree-1/item/node-1/path');
    expect(pathResponse.status).toBe(200);
    expect(nodeRepo.getPathToRoot).toHaveBeenCalledWith('tree-1', 'node-1');

    const subtreeResponse = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1/subtree',
      query: { maxDepth: '2' }
    });
    expect(subtreeResponse.status).toBe(200);
    expect(nodeRepo.getSubtree).toHaveBeenCalledWith('tree-1', 'node-1', { maxDepth: 2 });

    const moveResponse = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1/move',
      method: 'POST',
      body: { newParentId: 'node-2' }
    });
    expect(moveResponse.status).toBe(200);
    expect(nodeRepo.moveSubtree).toHaveBeenCalledWith('tree-1', 'node-1', 'node-2');

    const listByTypeResponse = await performRequest(app, '/api1/node/tree-1/by-type/folder');
    expect(listByTypeResponse.status).toBe(200);
    expect(nodeRepo.listByType).toHaveBeenCalledWith('tree-1', 'folder');

    const incrementResponse = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1/counter',
      method: 'POST',
      body: { counter: 'views', delta: 2 }
    });
    expect(incrementResponse.status).toBe(200);
    expect(nodeRepo.incrementCounter).toHaveBeenCalledWith('tree-1', 'node-1', 'views', 2);
  });

  it('validates node update input', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1',
      method: 'PATCH',
      body: {}
    });

    expect(response.status).toBe(400);
    expect(nodeRepo.updateNode).not.toHaveBeenCalled();
  });

  it('validates move subtree request', async () => {
    const { pool } = createMockPool([]);
    const treeRepo = createMockTreeRepo();
    const nodeRepo = createMockNodeRepo();
    nodeRepo.moveSubtree.mockResolvedValue();
    const app = createApp({
      pool,
      treeRepository: treeRepo,
      nodeRepository: nodeRepo,
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node/tree-1/item/node-1/move',
      method: 'POST',
      body: {}
    });

    expect(response.status).toBe(200);
    expect(nodeRepo.moveSubtree).toHaveBeenCalledWith('tree-1', 'node-1', null);
  });
});

describe('Metrics endpoints', () => {
  beforeEach(() => {
    LatencyStats.reset();
  });

  it('returns latency snapshot', async () => {
    LatencyStats.update('GET /example', 10);
    LatencyStats.update('GET /example', 30);

    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      latency: {
        'GET /example': {
          count: 2,
          minMs: expect.any(Number),
          maxMs: expect.any(Number),
          avgMs: expect.any(Number)
        }
      }
    });
    expect(response.body.latency['GET /example'].minMs).toBe(10);
    expect(response.body.latency['GET /example'].maxMs).toBe(30);
    expect(response.body.latency['GET /example'].avgMs).toBeCloseTo(20, 2);
  });

  it('resets collected metrics', async () => {
    LatencyStats.update('GET /example', 5);

    const { pool } = createMockPool([]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const resetResponse = await performRequest(app, {
      url: '/api1/metrics/reset',
      method: 'POST'
    });

    expect(resetResponse.status).toBe(204);
    const snapshot = LatencyStats.snapshot();
    expect(snapshot['GET /example']).toBeUndefined();
  });
});

describe('Node category endpoints', () => {
  it('lists node categories', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow();
    categoryRepo.listCategories.mockResolvedValue([category]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node-categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeCategory(category)]);
    expect(categoryRepo.listCategories).toHaveBeenCalledWith(undefined);
  });

  it('filters node categories by parent', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow({ parent_id: 'category-root' });
    categoryRepo.listCategories.mockResolvedValue([category]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, { url: '/api1/node-categories', query: { parentId: 'category-root' } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeCategory(category)]);
    expect(categoryRepo.listCategories).toHaveBeenCalledWith('category-root');
  });

  it('creates a node category', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow({ name: 'Folder' });
    categoryRepo.createCategory.mockResolvedValue(category);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node-categories',
      method: 'POST',
      body: { name: ' Folder ', parentId: null, props: { color: 'blue' } }
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(serializeCategory(category));
    expect(categoryRepo.createCategory).toHaveBeenCalledWith({
      name: 'Folder',
      parentId: null,
      props: { color: 'blue' },
    });
  });

  it('validates node category payloads on create', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node-categories',
      method: 'POST',
      body: {}
    });

    expect(response.status).toBe(400);
    expect(categoryRepo.createCategory).not.toHaveBeenCalled();
  });

  it('retrieves a node category by id', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow();
    categoryRepo.getCategoryById.mockResolvedValue(category);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node-categories/category-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(serializeCategory(category));
    expect(categoryRepo.getCategoryById).toHaveBeenCalledWith('category-1');
    expect(categoryRepo.getCategoryByName).not.toHaveBeenCalled();
  });

  it('retrieves a node category by name when query parameter is present', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow({ name: 'Category by name' });
    categoryRepo.getCategoryByName.mockResolvedValue(category);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node-categories/category-1?name=Category%20by%20name');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(serializeCategory(category));
    expect(categoryRepo.getCategoryByName).toHaveBeenCalledWith('Category by name');
    expect(categoryRepo.getCategoryById).not.toHaveBeenCalled();
  });

  it('returns 404 when node category missing', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    categoryRepo.getCategoryById.mockResolvedValue(undefined);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/node-categories/missing');
    expect(response.status).toBe(404);
    expect(categoryRepo.getCategoryById).toHaveBeenCalledWith('missing');
  });

  it('updates a node category', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const category = createCategoryRow({ name: 'Updated', parent_id: 'category-root' });
    categoryRepo.updateCategory.mockResolvedValue(category);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node-categories/category-1',
      method: 'PATCH',
      body: { name: 'Updated', parentId: 'category-root' }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(serializeCategory(category));
    expect(categoryRepo.updateCategory).toHaveBeenCalledWith('category-1', {
      name: 'Updated',
      parentId: 'category-root',
    });
  });

  it('rejects invalid node category updates', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node-categories/category-1',
      method: 'PATCH',
      body: {}
    });

    expect(response.status).toBe(400);
    expect(categoryRepo.updateCategory).not.toHaveBeenCalled();
  });

  it('deletes a node category', async () => {
    const { pool } = createMockPool([]);
    const categoryRepo = createMockCategoryRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: categoryRepo,
      layerRepository: createMockLayerRepo(),
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, {
      url: '/api1/node-categories/category-1',
      method: 'DELETE'
    });

    expect(response.status).toBe(204);
    expect(categoryRepo.deleteCategory).toHaveBeenCalledWith('category-1');
  });
});

describe('Layer endpoints', () => {
  it('lists layers', async () => {
    const { pool } = createMockPool([]);
    const layerRepo = createMockLayerRepo();
    const layer = createLayerRow();
    layerRepo.listLayers.mockResolvedValue([layer]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: layerRepo,
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/layer');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeLayer(layer)]);
    expect(layerRepo.listLayers).toHaveBeenCalledTimes(1);
  });

  it('creates, fetches, updates and deletes a layer', async () => {
    const { pool } = createMockPool([]);
    const layerRepo = createMockLayerRepo();
    const created = createLayerRow();
    const renamed = { ...created, name: 'Updated Layer' };
    layerRepo.createLayer.mockResolvedValue(created);
    layerRepo.getLayer.mockResolvedValue(created);
    layerRepo.renameLayer.mockResolvedValue(renamed);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: layerRepo,
      edgeRepository: createMockEdgeRepo()
    });

    const createResponse = await performRequest(app, {
      url: '/api1/layer',
      method: 'POST',
      body: { name: 'Layer' }
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual(serializeLayer(created));
    expect(layerRepo.createLayer).toHaveBeenCalledWith('Layer');

    const getResponse = await performRequest(app, '/api1/layer/layer-1');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(serializeLayer(created));
    expect(layerRepo.getLayer).toHaveBeenCalledWith('layer-1');

    const updateResponse = await performRequest(app, {
      url: '/api1/layer/layer-1',
      method: 'PUT',
      body: { name: 'Updated Layer' }
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(serializeLayer(renamed));
    expect(layerRepo.renameLayer).toHaveBeenCalledWith('layer-1', 'Updated Layer');

    const deleteResponse = await performRequest(app, {
      url: '/api1/layer/layer-1',
      method: 'DELETE'
    });
    expect(deleteResponse.status).toBe(204);
    expect(layerRepo.deleteLayer).toHaveBeenCalledWith('layer-1');
  });

  it('returns 404 when layer missing', async () => {
    const { pool } = createMockPool([]);
    const layerRepo = createMockLayerRepo();
    layerRepo.getLayer.mockResolvedValue(undefined);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: layerRepo,
      edgeRepository: createMockEdgeRepo()
    });

    const response = await performRequest(app, '/api1/layer/layer-404');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Layer not found' });
  });

  it('validates layer payloads', async () => {
    const { pool } = createMockPool([]);
    const layerRepo = createMockLayerRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: layerRepo,
      edgeRepository: createMockEdgeRepo()
    });

    const createResponse = await performRequest(app, {
      url: '/api1/layer',
      method: 'POST',
      body: {}
    });
    expect(createResponse.status).toBe(400);
    expect(layerRepo.createLayer).not.toHaveBeenCalled();

    const updateResponse = await performRequest(app, {
      url: '/api1/layer/layer-1',
      method: 'PUT',
      body: {}
    });
    expect(updateResponse.status).toBe(400);
    expect(layerRepo.renameLayer).not.toHaveBeenCalled();
  });
});

describe('Edge endpoints', () => {
  it('lists edges', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const edge = createEdgeRow();
    edgeRepo.listEdges.mockResolvedValue([edge]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, '/api1/edge');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeEdge(edge)]);
    expect(edgeRepo.listEdges).toHaveBeenCalledTimes(1);
  });

  it('lists edges filtered by layer', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const edge = createEdgeRow();
    edgeRepo.listEdgesByLayer.mockResolvedValue([edge]);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, { url: '/api1/edge', query: { layerId: 'layer-1' } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([serializeEdge(edge)]);
    expect(edgeRepo.listEdgesByLayer).toHaveBeenCalledWith('layer-1');
  });

  it('creates and retrieves an edge', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const edge = createEdgeRow();
    edgeRepo.createEdge.mockResolvedValue(edge);
    edgeRepo.getEdge.mockResolvedValue(edge);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const createResponse = await performRequest(app, {
      url: '/api1/edge/layer-1',
      method: 'POST',
      body: { name: ' Edge ', from: ' node-1 ', to: ' node-2 ', props: { weight: 1 } }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual(serializeEdge(edge));
    expect(edgeRepo.createEdge).toHaveBeenCalledWith({
      layerId: 'layer-1',
      name: 'Edge',
      from: 'node-1',
      to: 'node-2',
      props: { weight: 1 }
    });

    const getResponse = await performRequest(app, '/api1/edge/item/edge-1');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(serializeEdge(edge));
    expect(edgeRepo.getEdge).toHaveBeenCalledWith('edge-1');
  });

  it('validates edge creation input', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      nodeRepository: createMockNodeRepo(),
      categoryRepository: createMockCategoryRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, { url: '/api1/edge/layer-1', method: 'POST', body: {} });

    expect(response.status).toBe(400);
    expect(edgeRepo.createEdge).not.toHaveBeenCalled();
  });

  it('returns 404 when edge missing', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    edgeRepo.getEdge.mockResolvedValue(undefined);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, '/api1/edge/item/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Edge not found' });
  });

  it('updates and deletes an edge', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const updated = createEdgeRow({ name: 'Updated Edge' });
    edgeRepo.updateEdge.mockResolvedValue(updated);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const updateResponse = await performRequest(app, {
      url: '/api1/edge/item/edge-1',
      method: 'PATCH',
      body: { name: 'Updated Edge' }
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(serializeEdge(updated));
    expect(edgeRepo.updateEdge).toHaveBeenCalledWith('edge-1', { name: 'Updated Edge' });

    const deleteResponse = await performRequest(app, {
      url: '/api1/edge/item/edge-1',
      method: 'DELETE'
    });

    expect(deleteResponse.status).toBe(204);
    expect(edgeRepo.deleteEdge).toHaveBeenCalledWith('edge-1');
  });

  it('validates edge update payload', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, {
      url: '/api1/edge/item/edge-1',
      method: 'PATCH',
      body: {}
    });

    expect(response.status).toBe(400);
    expect(edgeRepo.updateEdge).not.toHaveBeenCalled();
  });

  it('returns 404 when updating missing edge', async () => {
    const { pool } = createMockPool([]);
    const edgeRepo = createMockEdgeRepo();
    edgeRepo.updateEdge.mockResolvedValue(undefined);
    const app = createApp({
      pool,
      treeRepository: createMockTreeRepo(),
      layerRepository: createMockLayerRepo(),
      edgeRepository: edgeRepo
    });

    const response = await performRequest(app, {
      url: '/api1/edge/item/edge-1',
      method: 'PATCH',
      body: { name: 'Updated Edge' }
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Edge not found' });
  });
});
