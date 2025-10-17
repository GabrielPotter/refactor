import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

const TAGS = {
  appInfo: "App Info",
  jsonSchemas: "JSON Schemas",
  trees: "Trees",
  layers: "Layers",
  edgeCategories: "Edge Categories",
  edgeTypes: "Edge Types",
  nodeCategories: "Node Categories",
  nodeTypes: "Node Types",
  nodes: "Nodes",
  edges: "Edges",
  devSchema: "Dev Schema",
  metrics: "Metrics",
  console: "Console",
  environment: "Environment",
} as const;

const tagged = <T extends Record<string, unknown>>(tag: string, operation: T): T & { tags: [string] } => ({
  tags: [tag],
  ...operation,
});

const appInfoPaths = {
  "/api/app-info": {
    put: tagged(TAGS.appInfo, {
      summary: "Create app info entry",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AppInfoCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } },
        },
        "400": { description: "Invalid payload" },
      },
    }),
  },
  "/api/app-info/{name}": {
    parameters: [{ $ref: "#/components/parameters/AppInfoNameParam" }],
    get: tagged(TAGS.appInfo, {
      summary: "Read app info entry",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.appInfo, {
      summary: "Update app info entry",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AppInfoUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.appInfo, {
      summary: "Delete app info entry",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const jsonSchemaPaths = {
  "/api/json-schemas": {
    put: tagged(TAGS.jsonSchemas, {
      summary: "Create JSON schema",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/JsonSchemaCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/JsonSchema" } } },
        },
      },
    }),
  },
  "/api/json-schemas/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.jsonSchemas, {
      summary: "Read JSON schema",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/JsonSchema" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.jsonSchemas, {
      summary: "Update JSON schema",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/JsonSchemaUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/JsonSchema" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.jsonSchemas, {
      summary: "Delete JSON schema",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const treePaths = {
  "/api/trees": {
    put: tagged(TAGS.trees, {
      summary: "Create tree",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TreeCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } },
        },
      },
    }),
  },
  "/api/trees/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.trees, {
      summary: "Read tree",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.trees, {
      summary: "Update tree",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TreeUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.trees, {
      summary: "Delete tree",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const layerPaths = {
  "/api/layers": {
    put: tagged(TAGS.layers, {
      summary: "Create layer",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LayerCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } },
        },
      },
    }),
  },
  "/api/layers/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.layers, {
      summary: "Read layer",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.layers, {
      summary: "Update layer",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LayerUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.layers, {
      summary: "Delete layer",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const edgeCategoryPaths = {
  "/api/edge-categories": {
    put: tagged(TAGS.edgeCategories, {
      summary: "Create edge category",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeCategoryCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeCategory" } } },
        },
      },
    }),
  },
  "/api/edge-categories/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.edgeCategories, {
      summary: "Read edge category",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeCategory" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.edgeCategories, {
      summary: "Update edge category",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeCategoryUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeCategory" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.edgeCategories, {
      summary: "Delete edge category",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const edgeTypePaths = {
  "/api/edge-types": {
    put: tagged(TAGS.edgeTypes, {
      summary: "Create edge type",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeTypeCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeType" } } },
        },
      },
    }),
  },
  "/api/edge-types/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.edgeTypes, {
      summary: "Read edge type",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeType" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.edgeTypes, {
      summary: "Update edge type",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeTypeUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeType" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.edgeTypes, {
      summary: "Delete edge type",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const nodeCategoryPaths = {
  "/api/node-categories": {
    put: tagged(TAGS.nodeCategories, {
      summary: "Create node category",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeCategoryCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeCategory" } } },
        },
      },
    }),
  },
  "/api/node-categories/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.nodeCategories, {
      summary: "Read node category",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeCategory" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.nodeCategories, {
      summary: "Update node category",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeCategoryUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeCategory" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.nodeCategories, {
      summary: "Delete node category",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const nodeTypePaths = {
  "/api/node-types": {
    put: tagged(TAGS.nodeTypes, {
      summary: "Create node type",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeTypeCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeType" } } },
        },
      },
    }),
  },
  "/api/node-types/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.nodeTypes, {
      summary: "Read node type",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeType" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.nodeTypes, {
      summary: "Update node type",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeTypeUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/NodeType" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.nodeTypes, {
      summary: "Delete node type",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const nodePaths = {
  "/api/nodes": {
    put: tagged(TAGS.nodes, {
      summary: "Create node",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Node" } } },
        },
      },
    }),
  },
  "/api/nodes/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.nodes, {
      summary: "Read node",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Node" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.nodes, {
      summary: "Update node",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/NodeUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Node" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.nodes, {
      summary: "Delete node",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const edgePaths = {
  "/api/edges": {
    put: tagged(TAGS.edges, {
      summary: "Create edge",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeCreate" },
          },
        },
      },
      responses: {
        "201": {
          description: "Created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Edge" } } },
        },
      },
    }),
  },
  "/api/edges/{id}": {
    parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
    get: tagged(TAGS.edges, {
      summary: "Read edge",
      responses: {
        "200": {
          description: "Found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Edge" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    patch: tagged(TAGS.edges, {
      summary: "Update edge",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EdgeUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Edge" } } },
        },
        "404": { description: "Not found" },
      },
    }),
    delete: tagged(TAGS.edges, {
      summary: "Delete edge",
      responses: {
        "204": { description: "Deleted" },
      },
    }),
  },
};

const devSchemaPaths = {
  "/api/db/reset": {
    post: tagged(TAGS.devSchema, {
      summary: "Reset database schema",
      description: "Drops and recreates all tables using the DevSchema helper.",
      responses: {
        "200": {
          description: "Schema reset completed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DevSchemaActionResult" },
            },
          },
        },
      },
    }),
  },
  "/api/db/drop": {
    post: tagged(TAGS.devSchema, {
      summary: "Drop database schema",
      description: "Drops all tables using the DevSchema helper.",
      responses: {
        "200": {
          description: "Schema drop completed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DevSchemaActionResult" },
            },
          },
        },
      },
    }),
  },
  "/api/db/create": {
    post: tagged(TAGS.devSchema, {
      summary: "Create database schema",
      description: "Creates all tables using the DevSchema helper.",
      responses: {
        "200": {
          description: "Schema creation completed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DevSchemaActionResult" },
            },
          },
        },
      },
    }),
  },
};

const metricsPaths = {
  "/api/metrics": {
    get: tagged(TAGS.metrics, {
      summary: "Read collected metrics",
      responses: {
        "200": {
          description: "Snapshot",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MetricsSnapshot" },
            },
          },
        },
      },
    }),
  },
  "/api/metrics/reset": {
    post: tagged(TAGS.metrics, {
      summary: "Reset collected metrics",
      responses: {
        "204": { description: "Reset" },
      },
    }),
  },
};

const consolePaths = {
  "/api/console": {
    post: tagged(TAGS.console, {
      summary: "Execute console command",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["command"],
              properties: {
                command: { type: "string", example: "create tree \"demo\"" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Executed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  logs: { type: "array", items: { type: "string" } },
                  result: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
        },
        "400": { description: "Invalid command" },
      },
    }),
  },
};

const envPaths = {
  "/api/env": {
    get: tagged(TAGS.environment, {
      summary: "Environment snapshot",
      responses: {
        "200": {
          description: "Snapshot",
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Platform, process and host details (shape depends on runtime).",
              },
            },
          },
        },
      },
    }),
  },
};

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Refactor API",
    version: "1.0.0",
    description: "HTTP interface generated from the repository + router layout.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: TAGS.appInfo, description: "Manage entries in the app_info table." },
    { name: TAGS.jsonSchemas, description: "Create and maintain reusable JSON schema definitions." },
    { name: TAGS.trees, description: "Work with tree roots and associated metadata." },
    { name: TAGS.layers, description: "Manage layers that group edges." },
    { name: TAGS.edgeCategories, description: "CRUD operations for edge categories and their hierarchy." },
    { name: TAGS.edgeTypes, description: "Define and update edge types." },
    { name: TAGS.nodeCategories, description: "CRUD operations for node categories and their hierarchy." },
    { name: TAGS.nodeTypes, description: "Define and update node types." },
    { name: TAGS.nodes, description: "Manipulate individual nodes within trees." },
    { name: TAGS.edges, description: "Manage connections between nodes." },
    { name: TAGS.devSchema, description: "Development helpers for resetting, dropping, or creating the schema." },
    { name: TAGS.metrics, description: "Inspect and reset latency metrics." },
    { name: TAGS.console, description: "Execute DSL commands through the console endpoint." },
    { name: TAGS.environment, description: "Retrieve environment and diagnostic information." },
  ],
  paths: {
    ...appInfoPaths,
    ...jsonSchemaPaths,
    ...treePaths,
    ...layerPaths,
    ...edgeCategoryPaths,
    ...edgeTypePaths,
    ...nodeCategoryPaths,
    ...nodeTypePaths,
    ...nodePaths,
    ...edgePaths,
    ...devSchemaPaths,
    ...metricsPaths,
    ...consolePaths,
    ...envPaths,
  },
  components: {
    parameters: {
      IdPathParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      AppInfoNameParam: {
        name: "name",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    },
    schemas: {
      JsonValue: {
        description: "Arbitrary JSON value",
        anyOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "null" },
          { type: "array", items: { $ref: "#/components/schemas/JsonValue" } },
          { type: "object", additionalProperties: { $ref: "#/components/schemas/JsonValue" } },
        ],
      },
      DevSchemaActionResult: {
        type: "object",
        required: ["status", "action"],
        properties: {
          status: { type: "string", enum: ["ok"] },
          action: { type: "string", enum: ["reset", "drop", "create"] },
        },
        example: { status: "ok", action: "reset" },
      },
      AppInfo: {
        type: "object",
        properties: {
          name: { type: "string" },
          version: { type: "string" },
        },
        required: ["name", "version"],
      },
      AppInfoCreate: {
        type: "object",
        required: ["name", "version"],
        properties: {
          name: { type: "string", example: "refactor" },
          version: { type: "string", example: "1.0.0" },
        },
      },
      AppInfoUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          version: { type: "string" },
        },
        additionalProperties: false,
      },
      JsonSchema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      JsonSchemaCreate: {
        type: "object",
        required: ["name", "schema"],
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      JsonSchemaUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      Tree: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      TreeCreate: {
        type: "object",
        required: ["name", "props", "props_schema"],
        properties: {
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
        },
      },
      TreeUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
        },
      },
      Layer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      LayerCreate: {
        type: "object",
        required: ["name", "props", "props_schema"],
        properties: {
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
        },
      },
      LayerUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          props: { $ref: "#/components/schemas/JsonValue" },
          props_schema: { type: "string", format: "uuid" },
        },
      },
      EdgeCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      EdgeCategoryCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      EdgeCategoryUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      EdgeType: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      EdgeTypeCreate: {
        type: "object",
        required: ["name", "schema"],
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      EdgeTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      NodeCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      NodeCategoryCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      NodeCategoryUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          schema: { $ref: "#/components/schemas/JsonValue" },
          parentIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      NodeType: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      NodeTypeCreate: {
        type: "object",
        required: ["name", "schema"],
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      NodeTypeUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          schema: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      Node: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          tree_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
          is_leaf: { type: "boolean" },
          depth: { type: "integer" },
          euler_in: { type: "integer" },
          euler_out: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      NodeCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          tree_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
          is_leaf: { type: "boolean" },
          depth: { type: "integer" },
          euler_in: { type: "integer" },
          euler_out: { type: "integer" },
        },
      },
      NodeUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
          tree_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
          is_leaf: { type: "boolean" },
          depth: { type: "integer" },
          euler_in: { type: "integer" },
          euler_out: { type: "integer" },
        },
      },
      Edge: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          layer_id: { type: "string", format: "uuid", nullable: true },
          a_tree_id: { type: "string", format: "uuid", nullable: true },
          a_node_id: { type: "string", format: "uuid", nullable: true },
          b_tree_id: { type: "string", format: "uuid", nullable: true },
          b_node_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      EdgeCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          layer_id: { type: "string", format: "uuid", nullable: true },
          a_tree_id: { type: "string", format: "uuid", nullable: true },
          a_node_id: { type: "string", format: "uuid", nullable: true },
          b_tree_id: { type: "string", format: "uuid", nullable: true },
          b_node_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      EdgeUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          layer_id: { type: "string", format: "uuid", nullable: true },
          a_tree_id: { type: "string", format: "uuid", nullable: true },
          a_node_id: { type: "string", format: "uuid", nullable: true },
          b_tree_id: { type: "string", format: "uuid", nullable: true },
          b_node_id: { type: "string", format: "uuid", nullable: true },
          category_id: { type: "string", format: "uuid", nullable: true },
          type_id: { type: "string", format: "uuid", nullable: true },
          props: { $ref: "#/components/schemas/JsonValue" },
        },
      },
      MetricsSnapshot: {
        type: "object",
        properties: {
          latency: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                count: { type: "integer" },
                average: { type: "number" },
                p95: { type: "number" },
                p99: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/swagger.json", (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
};
