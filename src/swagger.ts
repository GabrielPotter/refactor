import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

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
  paths: {
    "/api/app-info": {
      put: {
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
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } } },
          "400": { description: "Invalid payload" },
        },
      },
    },
    "/api/app-info/{name}": {
      parameters: [{ $ref: "#/components/parameters/AppInfoNameParam" }],
      get: {
        summary: "Read app info entry",
        responses: {
          "200": { description: "Found", content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } } },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
          "200": { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/AppInfo" } } } },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete app info entry",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/json-schemas": {
      put: {
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
      },
    },
    "/api/json-schemas/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read JSON schema",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/JsonSchema" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete JSON schema",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/trees": {
      put: {
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
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } } },
        },
      },
    },
    "/api/trees/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read tree",
        responses: {
          "200": { description: "Found", content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } } },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
          "200": { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Tree" } } } },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete tree",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/layers": {
      put: {
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
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } } },
        },
      },
    },
    "/api/layers/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read layer",
        responses: {
          "200": { description: "Found", content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } } },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
          "200": { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Layer" } } } },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete layer",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/edge-categories": {
      put: {
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
      },
    },
    "/api/edge-categories/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read edge category",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeCategory" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete edge category",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/edge-types": {
      put: {
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
      },
    },
    "/api/edge-types/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read edge type",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/EdgeType" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete edge type",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/node-categories": {
      put: {
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
      },
    },
    "/api/node-categories/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read node category",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/NodeCategory" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete node category",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/node-types": {
      put: {
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
      },
    },
    "/api/node-types/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read node type",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/NodeType" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete node type",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/nodes": {
      put: {
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
      },
    },
    "/api/nodes/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read node",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Node" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete node",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/edges": {
      put: {
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
      },
    },
    "/api/edges/{id}": {
      parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
      get: {
        summary: "Read edge",
        responses: {
          "200": {
            description: "Found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Edge" } } },
          },
          "404": { description: "Not found" },
        },
      },
      patch: {
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
      },
      delete: {
        summary: "Delete edge",
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },
    "/api/metrics": {
      get: {
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
      },
    },
    "/api/metrics/reset": {
      post: {
        summary: "Reset collected metrics",
        responses: {
          "204": { description: "Reset" },
        },
      },
    },
    "/api/console": {
      post: {
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
                    result: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid command" },
        },
      },
    },
    "/api/env": {
      get: {
        summary: "Environment snapshot",
        responses: {
          "200": {
            description: "Snapshot",
            content: {
              "application/json": {
                schema: { type: "object", description: "Platform, process and host details (shape depends on runtime)." },
              },
            },
          },
        },
      },
    },
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
