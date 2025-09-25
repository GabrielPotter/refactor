import express, { NextFunction, Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

import { DevSchema } from './db/schema.dev';
import type { DB } from './db/types';
import { TreeRepository } from './repositories/TreeRepository';
import { LayerRepository } from './repositories/LayerRepository';
import { EdgeRepository } from './repositories/EdgeRepository';

type TreeRepositoryContract = Pick<
  TreeRepository,
  | 'createTree'
  | 'listTrees'
  | 'listAllNodes'
  | 'renameTree'
  | 'deleteTree'
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
>;

type LayerRepositoryContract = Pick<
  LayerRepository,
  | 'listLayers'
  | 'getLayer'
  | 'createLayer'
  | 'renameLayer'
  | 'deleteLayer'
>;

type EdgeRepositoryContract = Pick<
  EdgeRepository,
  | 'listEdges'
  | 'listEdgesByLayer'
  | 'getEdge'
  | 'createEdge'
  | 'updateEdge'
  | 'deleteEdge'
>;

const createPool = (): Pool => {
  return new Pool({
    host: process.env.PGHOST ?? process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? process.env.POSTGRES_PORT ?? 5432),
    user: process.env.PGUSER ?? process.env.POSTGRES_USER ?? 'refactor',
    password: process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? 'refactor',
    database: process.env.PGDATABASE ?? process.env.POSTGRES_DB ?? 'refactor'
  });
};

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Refactor API',
    version: '1.0.0',
    description: 'Simple REST API with Swagger documentation'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server'
    }
  ],
  paths: {
    '/': {
      get: {
        summary: 'Root endpoint',
        description: 'Fetches the refactor entry from the app_info table.',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'refactor' },
                    version: { type: 'string', example: '1.0.0' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Entry not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'refactor entry not found' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api1': {
      get: {
        summary: 'API 1 endpoint',
        description: 'Provides a JSON payload identifying api1.',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    endpoint: { type: 'string', example: 'api1' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api2': {
      get: {
        summary: 'API 2 endpoint',
        description: 'Provides a JSON payload identifying api2.',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    endpoint: { type: 'string', example: 'api2' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api1/tree': {
      get: {
        summary: 'List trees',
        description: 'Returns all trees.',
        responses: {
          '200': {
            description: 'List of trees',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tree' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create tree',
        description: 'Creates a new tree.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'My tree' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Tree created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tree' }
              }
            }
          },
          '400': {
            description: 'Invalid input'
          }
        }
      }
    },
    '/api1/tree/{treeId}': {
      put: {
        summary: 'Rename tree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Renamed tree' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Tree renamed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tree' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      },
      delete: {
        summary: 'Delete tree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': { description: 'Tree deleted' }
        }
      }
    },
    '/api1/tree/{treeId}/nodes': {
      get: {
        summary: 'List child nodes',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'parentId',
            in: 'query',
            required: false,
            schema: { type: 'string', nullable: true }
          }
        ],
        responses: {
          '200': {
            description: 'List of nodes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNode' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create node',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  parentId: { type: 'string', nullable: true },
                  position: { type: 'integer' },
                  props: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Node created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TreeNode' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      }
    },
    '/api1/tree/{treeId}/nodes-all': {
      get: {
        summary: 'List all nodes in tree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'All nodes ordered by parent and position',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNode' }
                }
              }
            }
          }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/{nodeId}': {
      get: {
        summary: 'Get node',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Node details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TreeNode' }
              }
            }
          },
          '404': { description: 'Not found' }
        }
      },
      patch: {
        summary: 'Update node',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  position: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Node updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TreeNode' }
              }
            }
          },
          '400': { description: 'Invalid input' },
          '404': { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Delete subtree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': { description: 'Subtree deleted' }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/{nodeId}/path': {
      get: {
        summary: 'Get node path to root',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Path to root',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNodeWithDepth' }
                }
              }
            }
          }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/{nodeId}/subtree': {
      get: {
        summary: 'Get subtree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'maxDepth',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Subtree nodes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNodeWithDepth' }
                }
              }
            }
          },
          '400': { description: 'Invalid depth' }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/{nodeId}/move': {
      post: {
        summary: 'Move subtree',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  newParentId: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Subtree moved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    action: { type: 'string' },
                    nodeId: { type: 'string' },
                    newParentId: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/by-type/{type}': {
      get: {
        summary: 'Filter nodes by type',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'type',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Matching nodes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TreeNode' }
                }
              }
            }
          }
        }
      }
    },
    '/api1/tree/{treeId}/nodes/{nodeId}/counter': {
      post: {
        summary: 'Increment node counter',
        parameters: [
          {
            name: 'treeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'nodeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['counter'],
                properties: {
                  counter: { type: 'string' },
                  delta: { type: 'integer', default: 1 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated node',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TreeNode' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      }
    },
    '/api1/layer': {
      get: {
        summary: 'List layers',
        responses: {
          '200': {
            description: 'List of layers',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Layer' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create layer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Layer A' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Layer created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Layer' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      }
    },
    '/api1/layer/{layerId}': {
      get: {
        summary: 'Get layer',
        parameters: [
          {
            name: 'layerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Layer details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Layer' }
              }
            }
          },
          '404': { description: 'Not found' }
        }
      },
      put: {
        summary: 'Rename layer',
        parameters: [
          {
            name: 'layerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Updated Layer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Layer renamed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Layer' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      },
      delete: {
        summary: 'Delete layer',
        parameters: [
          {
            name: 'layerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': { description: 'Layer deleted' }
        }
      }
    },
    '/api1/edge': {
      get: {
        summary: 'List edges',
        parameters: [
          {
            name: 'layerId',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'List of edges',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Edge' }
                }
              }
            }
          }
        }
      },
    },
    '/api1/edge/{layerId}': {
      post: {
        summary: 'Create edge',
        parameters: [
          {
            name: 'layerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'from', 'to'],
                properties: {
                  name: { type: 'string', example: 'Edge A' },
                  from: { type: 'string', format: 'uuid' },
                  to: { type: 'string', format: 'uuid' },
                  props: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Edge created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Edge' }
              }
            }
          },
          '400': { description: 'Invalid input' }
        }
      }
    },
    '/api1/edge/item/{edgeId}': {
      get: {
        summary: 'Get edge',
        parameters: [
          {
            name: 'edgeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Edge details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Edge' }
              }
            }
          },
          '404': { description: 'Not found' }
        }
      },
      patch: {
        summary: 'Update edge',
        parameters: [
          {
            name: 'edgeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  layerId: { type: 'string', format: 'uuid' },
                  from: { type: 'string', format: 'uuid' },
                  to: { type: 'string', format: 'uuid' },
                  props: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Edge updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Edge' }
              }
            }
          },
          '400': { description: 'Invalid input' },
          '404': { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Delete edge',
        parameters: [
          {
            name: 'edgeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': { description: 'Edge deleted' }
        }
      }
    },
    '/dev/schema/reset': {
      post: {
        summary: 'Reset development schema',
        description: 'Drops and recreates all database objects. Disabled outside development.',
        responses: {
          '200': {
            description: 'Schema reset successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    action: { type: 'string', example: 'reset' }
                  }
                }
              }
            }
          },
          '403': {
            description: 'Endpoint disabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Dev schema endpoints disabled' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dev/schema/create': {
      post: {
        summary: 'Create development schema',
        description: 'Creates all database objects without dropping existing ones.',
        responses: {
          '200': {
            description: 'Schema created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    action: { type: 'string', example: 'create' }
                  }
                }
              }
            }
          },
          '403': {
            description: 'Endpoint disabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Dev schema endpoints disabled' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dev/schema/drop': {
      post: {
        summary: 'Drop development schema',
        description: 'Drops all database objects created for development.',
        responses: {
          '200': {
            description: 'Schema dropped successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    action: { type: 'string', example: 'drop' }
                  }
                }
              }
            }
          },
          '403': {
            description: 'Endpoint disabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Dev schema endpoints disabled' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Tree: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Layer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Edge: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          layer_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          from: { type: 'string', format: 'uuid' },
          to: { type: 'string', format: 'uuid' },
          props: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      TreeNode: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tree_id: { type: 'string', format: 'uuid' },
          parent_id: { type: 'string', nullable: true },
          name: { type: 'string' },
          position: { type: 'integer' },
          props: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      TreeNodeWithDepth: {
        allOf: [
          { $ref: '#/components/schemas/TreeNode' },
          {
            type: 'object',
            properties: {
              depth: { type: 'integer', minimum: 0 }
            }
          }
        ]
      }
    }
  }
};

type AppDependencies = {
  pool?: Pool;
  devSchema?: Pick<typeof DevSchema, 'resetAll' | 'createAll' | 'dropAll'>;
  devSchemaEnabled?: boolean;
  createDevDb?: () => Promise<{ db: Kysely<DB>; destroy: () => Promise<void> }>;
  db?: Kysely<DB>;
  treeRepository?: TreeRepositoryContract;
  createTreeRepository?: (db: Kysely<DB>) => TreeRepositoryContract;
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
  layerRepository,
  createLayerRepository,
  edgeRepository,
  createEdgeRepository
}: AppDependencies = {}) => {
  const app = express();
  const dbPool = pool ?? createPool();
  const devSchemaApi = devSchema ?? DevSchema;
  const devApiEnabled =
    devSchemaEnabled ??
    (process.env.ENABLE_DEV_SCHEMA_API === 'true' || process.env.NODE_ENV !== 'production');

  const mainDb =
    db ??
    new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: dbPool
      })
    });
  const shouldDestroyDb = !db;

  const treeRepoFactory =
    createTreeRepository ?? ((database: Kysely<DB>): TreeRepositoryContract => new TreeRepository(database));
  const treeRepo = treeRepository ?? treeRepoFactory(mainDb);

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
        pool: createPool()
      });
      const db = new Kysely<DB>({ dialect });
      return {
        db,
        destroy: () => db.destroy()
      };
    });

  app.use(express.json());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/swagger.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });

  const devSchemaActions: Array<{
    path: string;
    action: string;
    handler: (db: Kysely<DB>) => Promise<void>;
  }> = [
    {
      path: '/dev/schema/reset',
      action: 'reset',
      handler: (db) => devSchemaApi.resetAll(db)
    },
    {
      path: '/dev/schema/create',
      action: 'create',
      handler: (db) => devSchemaApi.createAll(db)
    },
    {
      path: '/dev/schema/drop',
      action: 'drop',
      handler: (db) => devSchemaApi.dropAll(db)
    }
  ];

  if (devApiEnabled) {
    for (const { path, action, handler } of devSchemaActions) {
      app.post(path, async (_req: Request, res: Response, next: NextFunction) => {
        let devDb: { db: Kysely<DB>; destroy: () => Promise<void> } | undefined;
        try {
          devDb = await buildDevDb();
          await handler(devDb.db);
          res.status(200).json({ status: 'ok', action });
        } catch (error) {
          next(error);
        } finally {
          if (devDb) {
            await devDb.destroy().catch((destroyError) => {
              // eslint-disable-next-line no-console
              console.error('Error tearing down dev schema connection', destroyError);
            });
          }
        }
      });
    }
  } else {
    const disabledHandler = (_req: Request, res: Response) => {
      res.status(403).json({ error: 'Dev schema endpoints disabled' });
    };
    app.post(devSchemaActions.map(({ path }) => path), disabledHandler);
  }

  const treeRouter = Router();
  const layerRouter = Router();
  const edgeRouter = Router();

  treeRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const trees = await treeRepo.listTrees();
      res.json(trees);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const tree = await treeRepo.createTree(name.trim());
      res.status(201).json(tree);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.put('/:treeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const tree = await treeRepo.renameTree(treeId, name.trim());
      res.status(200).json(tree);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.delete('/:treeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    try {
      await treeRepo.deleteTree(treeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  treeRouter.post('/:treeId/nodes', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const { name, parentId = null, position, props } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const node = await treeRepo.createNode({
        treeId,
        name: name.trim(),
        parentId: parentId === null || parentId === undefined ? null : String(parentId),
        position: position === undefined ? undefined : Number(position),
        props
      });
      res.status(201).json(node);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      const node = await treeRepo.getNode(treeId, nodeId);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(node);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    const parent = req.query.parentId;
    const parentId = parent === undefined || parent === '' ? null : (parent === 'null' ? null : String(parent));
    try {
      const nodes = await treeRepo.listChildren(treeId, parentId);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes-all', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId } = req.params;
    try {
      const nodes = await treeRepo.listAllNodes(treeId);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.patch('/:treeId/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const patch: Record<string, unknown> = req.body ?? {};
    const allowedPatch: { name?: string; position?: number } = {};

    if (typeof patch.name === 'string') {
      allowedPatch.name = patch.name.trim();
    }
    if (patch.position !== undefined) {
      const pos = Number(patch.position);
      if (!Number.isFinite(pos)) {
        res.status(400).json({ error: 'position must be a number' });
        return;
      }
      allowedPatch.position = pos;
    }

    if (!Object.keys(allowedPatch).length) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    try {
      const updated = await treeRepo.updateNode(treeId, nodeId, allowedPatch);
      if (!updated) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes/:nodeId/path', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      const path = await treeRepo.getPathToRoot(treeId, nodeId);
      res.json(path);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes/:nodeId/subtree', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { maxDepth } = req.query;
    const depth = maxDepth === undefined ? undefined : Number(maxDepth);
    if (depth !== undefined && (!Number.isInteger(depth) || depth < 0)) {
      res.status(400).json({ error: 'maxDepth must be a non-negative integer' });
      return;
    }

    try {
      const subtree = await treeRepo.getSubtree(treeId, nodeId, depth === undefined ? undefined : { maxDepth: depth });
      res.json(subtree);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.post('/:treeId/nodes/:nodeId/move', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { newParentId } = req.body ?? {};
    const parentId = newParentId === undefined || newParentId === null || newParentId === '' ? null : String(newParentId);

    try {
      await treeRepo.moveSubtree(treeId, nodeId, parentId);
      res.json({ status: 'ok', action: 'move', nodeId, newParentId: parentId });
    } catch (error) {
      next(error);
    }
  });

  treeRouter.delete('/:treeId/nodes/:nodeId', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    try {
      await treeRepo.deleteSubtree(treeId, nodeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  treeRouter.get('/:treeId/nodes/by-type/:type', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, type } = req.params;
    try {
      const nodes = await treeRepo.listByType(treeId, type);
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  treeRouter.post('/:treeId/nodes/:nodeId/counter', async (req: Request, res: Response, next: NextFunction) => {
    const { treeId, nodeId } = req.params;
    const { counter, delta } = req.body ?? {};
    if (typeof counter !== 'string' || !counter.trim()) {
      res.status(400).json({ error: 'counter is required' });
      return;
    }
    const increment = delta === undefined ? 1 : Number(delta);
    if (!Number.isFinite(increment)) {
      res.status(400).json({ error: 'delta must be a number' });
      return;
    }

    try {
      const result = await treeRepo.incrementCounter(treeId, nodeId, counter.trim(), increment);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api1/tree', treeRouter);

  edgeRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { layerId } = req.query;
      if (typeof layerId === 'string' && layerId.trim()) {
        const edges = await edgeRepo.listEdgesByLayer(layerId.trim());
        res.json(edges);
        return;
      }

      const edges = await edgeRepo.listEdges();
      res.json(edges);
    } catch (error) {
      next(error);
    }
  });

  edgeRouter.post('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    const { name, from, to, props } = req.body ?? {};

    if (typeof layerId !== 'string' || !layerId.trim()) {
      res.status(400).json({ error: 'layerId is required' });
      return;
    }
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (typeof from !== 'string' || !from.trim()) {
      res.status(400).json({ error: 'from is required' });
      return;
    }
    if (typeof to !== 'string' || !to.trim()) {
      res.status(400).json({ error: 'to is required' });
      return;
    }
    if (props !== undefined && (typeof props !== 'object' || props === null || Array.isArray(props))) {
      res.status(400).json({ error: 'props must be an object if provided' });
      return;
    }

    try {
      const edge = await edgeRepo.createEdge({
        layerId: layerId.trim(),
        name: name.trim(),
        from: from.trim(),
        to: to.trim(),
        props,
      });
      res.status(201).json(edge);
    } catch (error) {
      next(error);
    }
  });

  edgeRouter.get('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    try {
      const edge = await edgeRepo.getEdge(edgeId);
      if (!edge) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      res.json(edge);
    } catch (error) {
      next(error);
    }
  });

  edgeRouter.patch('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    const body = req.body ?? {};
    const patch: Record<string, unknown> = {};

    if (typeof body.name === 'string') {
      const trimmed = body.name.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'name cannot be empty' });
        return;
      }
      patch.name = trimmed;
    }
    if (body.layerId !== undefined) {
      if (typeof body.layerId !== 'string' || !body.layerId.trim()) {
        res.status(400).json({ error: 'layerId must be a non-empty string' });
        return;
      }
      patch.layer_id = body.layerId.trim();
    }
    if (body.from !== undefined) {
      if (typeof body.from !== 'string' || !body.from.trim()) {
        res.status(400).json({ error: 'from must be a non-empty string' });
        return;
      }
      patch.from = body.from.trim();
    }
    if (body.to !== undefined) {
      if (typeof body.to !== 'string' || !body.to.trim()) {
        res.status(400).json({ error: 'to must be a non-empty string' });
        return;
      }
      patch.to = body.to.trim();
    }
    if (body.props !== undefined) {
      if (typeof body.props !== 'object' || body.props === null || Array.isArray(body.props)) {
        res.status(400).json({ error: 'props must be an object if provided' });
        return;
      }
      patch.props = body.props;
    }

    if (!Object.keys(patch).length) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    try {
      const edge = await edgeRepo.updateEdge(edgeId, patch as any);
      if (!edge) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      res.json(edge);
    } catch (error) {
      next(error);
    }
  });

  edgeRouter.delete('/item/:edgeId', async (req: Request, res: Response, next: NextFunction) => {
    const { edgeId } = req.params;
    try {
      await edgeRepo.deleteEdge(edgeId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api1/edge', edgeRouter);

  layerRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const layers = await layerRepo.listLayers();
      res.json(layers);
    } catch (error) {
      next(error);
    }
  });

  layerRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const layer = await layerRepo.createLayer(name.trim());
      res.status(201).json(layer);
    } catch (error) {
      next(error);
    }
  });

  layerRouter.get('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    try {
      const layer = await layerRepo.getLayer(layerId);
      if (!layer) {
        res.status(404).json({ error: 'Layer not found' });
        return;
      }
      res.json(layer);
    } catch (error) {
      next(error);
    }
  });

  layerRouter.put('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    try {
      const layer = await layerRepo.renameLayer(layerId, name.trim());
      res.json(layer);
    } catch (error) {
      next(error);
    }
  });

  layerRouter.delete('/:layerId', async (req: Request, res: Response, next: NextFunction) => {
    const { layerId } = req.params;
    try {
      await layerRepo.deleteLayer(layerId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api1/layer', layerRouter);

  app.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dbPool.query<{ name: string; version: string }>(
        'SELECT name, version FROM app_info WHERE name = $1 LIMIT 1',
        ['refactor']
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'refactor entry not found' });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api1', (_req: Request, res: Response) => {
    res.json({ endpoint: 'api1' });
  });

  app.get('/api2', (_req: Request, res: Response) => {
    res.json({ endpoint: 'api2' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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

  server.on('close', () => {
    pool.end().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error closing Postgres pool', error);
    });
    if (typeof app.locals.destroyTreeDb === 'function') {
      app.locals.destroyTreeDb().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Error destroying Kysely instance', error);
      });
    }
  });

  return server;
};

if (require.main === module) {
  startServer();
}
