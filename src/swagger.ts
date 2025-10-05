import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Refactor API",
        version: "1.0.0",
        description: "Simple REST API with Swagger documentation",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
    ],
    paths: {
        "/": {
            get: {
                summary: "Root endpoint",
                description: "Fetches the refactor entry from the app_info table.",
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", example: "refactor" },
                                        version: { type: "string", example: "1.0.0" },
                                    },
                                },
                            },
                        },
                    },
                    "404": {
                        description: "Entry not found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "refactor entry not found" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1": {
            get: {
                summary: "API 1 endpoint",
                description: "Provides a JSON payload identifying api1.",
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        endpoint: { type: "string", example: "api1" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/env": {
            get: {
                summary: "Environment snapshot",
                description:
                    "Returns diagnostic information about the host running the application, including CPU, memory, process, and network details.",
                responses: {
                    "200": {
                        description: "Current environment details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/EnvSnapshot" },
                            },
                        },
                    },
                    "500": {
                        description: "Unexpected error",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Internal Server Error" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api2": {
            get: {
                summary: "API 2 endpoint",
                description: "Provides a JSON payload identifying api2.",
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        endpoint: { type: "string", example: "api2" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api2/console": {
            post: {
                summary: "Execute command via CommandInterpreter",
                description: "Submits a DSL command string for execution by the CommandInterpreter and returns the collected logs.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["command"],
                                properties: {
                                    command: {
                                        type: "string",
                                        description: "DSL command script to execute.",
                                        example: "create tree \"Example\" props '{\"label\":\"demo\"}';",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Command executed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                        logs: {
                                            type: "array",
                                            items: { type: "string" },
                                            description: "Log lines gathered during execution.",
                                        },
                                        result: {
                                            type: "array",
                                            description: "Return values produced by each executed command.",
                                            items: {
                                                type: "object",
                                                additionalProperties: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid command or execution error",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "error" },
                                        message: { type: "string", example: "The command field must be a non-empty string." },
                                        logs: {
                                            type: "array",
                                            items: { type: "string" },
                                            description: "Log lines collected before the error occurred.",
                                        },
                                        result: {
                                            type: "array",
                                            description: "Return values produced prior to the error (empty when parsing fails).",
                                            items: {
                                                type: "object",
                                                additionalProperties: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/tree": {
            get: {
                summary: "List trees",
                description: "Returns all trees.",
                responses: {
                    "200": {
                        description: "List of trees",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Tree" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: "Create tree",
                description: "Creates a new tree.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "My tree" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Tree created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Tree" },
                            },
                        },
                    },
                    "400": {
                        description: "Invalid input",
                    },
                },
            },
        },
        "/api1/tree/{treeId}": {
            put: {
                summary: "Rename tree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "Renamed tree" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Tree renamed",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Tree" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
            delete: {
                summary: "Delete tree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "204": { description: "Tree deleted" },
                },
            },
        },
        "/api1/node/{treeId}": {
            get: {
                summary: "List child nodes",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "parentId",
                        in: "query",
                        required: false,
                        schema: { type: "string", nullable: true },
                    },
                ],
                responses: {
                    "200": {
                        description: "List of nodes",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/TreeNode" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: "Create node",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string" },
                                    parentId: { type: "string", nullable: true },
                                    categoryId: { type: "string", nullable: true },
                                    position: { type: "integer" },
                                    props: { type: "object" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Node created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TreeNode" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
        },
        "/api1/node/{treeId}/all": {
            get: {
                summary: "List all nodes in tree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "All nodes ordered by parent and position",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/TreeNode" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/node/{treeId}/item/{nodeId}": {
            get: {
                summary: "Get node",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Node details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TreeNode" },
                            },
                        },
                    },
                    "404": { description: "Not found" },
                },
            },
            patch: {
                summary: "Update node",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    position: { type: "integer" },
                                    categoryId: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Node updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TreeNode" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                    "404": { description: "Not found" },
                },
            },
            delete: {
                summary: "Delete subtree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "204": { description: "Subtree deleted" },
                },
            },
        },
        "/api1/node/{treeId}/item/{nodeId}/path": {
            get: {
                summary: "Get node path to root",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Path to root",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/TreeNodeWithDepth" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/node/{treeId}/item/{nodeId}/subtree": {
            get: {
                summary: "Get subtree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "maxDepth",
                        in: "query",
                        required: false,
                        schema: { type: "integer", minimum: 0 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Subtree nodes",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/TreeNodeWithDepth" },
                                },
                            },
                        },
                    },
                    "400": { description: "Invalid depth" },
                },
            },
        },
        "/api1/node/{treeId}/item/{nodeId}/move": {
            post: {
                summary: "Move subtree",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    newParentId: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Subtree moved",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string" },
                                        action: { type: "string" },
                                        nodeId: { type: "string" },
                                        newParentId: { type: "string", nullable: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/node/{treeId}/by-type/{type}": {
            get: {
                summary: "Filter nodes by type",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "type",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Matching nodes",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/TreeNode" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/node/{treeId}/item/{nodeId}/counter": {
            post: {
                summary: "Increment node counter",
                parameters: [
                    {
                        name: "treeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "nodeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["counter"],
                                properties: {
                                    counter: { type: "string" },
                                    delta: { type: "integer", default: 1 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Updated node",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TreeNode" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
        },
        "/api1/metrics": {
            get: {
                summary: "Retrieve collected metrics",
                description: "Returns aggregated latency statistics for handled API routes.",
                responses: {
                    "200": {
                        description: "Metrics snapshot",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MetricsSnapshot" },
                            },
                        },
                    },
                },
            },
        },
        "/api1/metrics/reset": {
            post: {
                summary: "Reset collected metrics",
                description: "Clears the in-memory latency statistics.",
                responses: {
                    "204": { description: "Metrics reset successfully" },
                },
            },
        },
        "/api1/node-categories": {
            get: {
                summary: "List node types",
                description: "Returns node types optionally filtered by parent.",
                parameters: [
                    {
                        name: "parentId",
                        in: "query",
                        required: false,
                        schema: { type: "string", nullable: true },
                        description: 'Filter by parent type id. Use "null" to fetch root types.',
                    },
                ],
                responses: {
                    "200": {
                        description: "List of node types",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/NodeCategory" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: "Create node type",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NodeCategoryCreateRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Node type created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/NodeCategory" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
        },
        "/api1/node-categories/{categoryId}": {
            get: {
                summary: "Get node type",
                parameters: [
                    {
                        name: "categoryId",
                        in: "path",
                        required: false,
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "name",
                        in: "query",
                        required: false,
                        schema: { type: "string" },
                        description: "If provided, the category is looked up by name and the path id is ignored.",
                    },
                ],
                responses: {
                    "200": {
                        description: "Node category",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/NodeCategory" },
                            },
                        },
                    },
                    "404": { description: "Not found" },
                },
            },
            patch: {
                summary: "Update node type",
                parameters: [
                    {
                        name: "categoryId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NodeCategoryUpdateRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Updated node type",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/NodeCategory" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                    "404": { description: "Not found" },
                },
            },
            delete: {
                summary: "Delete node type",
                parameters: [
                    {
                        name: "categoryId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "204": { description: "Deleted" },
                    "404": { description: "Not found" },
                },
            },
        },
        "/api1/layer": {
            get: {
                summary: "List layers",
                responses: {
                    "200": {
                        description: "List of layers",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Layer" },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: "Create layer",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "Layer A" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Layer created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Layer" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
        },
        "/api1/layer/{layerId}": {
            get: {
                summary: "Get layer",
                parameters: [
                    {
                        name: "layerId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Layer details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Layer" },
                            },
                        },
                    },
                    "404": { description: "Not found" },
                },
            },
            put: {
                summary: "Rename layer",
                parameters: [
                    {
                        name: "layerId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "Updated Layer" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Layer renamed",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Layer" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
            delete: {
                summary: "Delete layer",
                parameters: [
                    {
                        name: "layerId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "204": { description: "Layer deleted" },
                },
            },
        },
        "/api1/edge": {
            get: {
                summary: "List edges",
                parameters: [
                    {
                        name: "layerId",
                        in: "query",
                        required: false,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "List of edges",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Edge" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api1/edge/{layerId}": {
            post: {
                summary: "Create edge",
                parameters: [
                    {
                        name: "layerId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "from", "to"],
                                properties: {
                                    name: { type: "string", example: "Edge A" },
                                    from: { type: "string", format: "uuid" },
                                    to: { type: "string", format: "uuid" },
                                    props: { type: "object" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Edge created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Edge" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                },
            },
        },
        "/api1/edge/item/{edgeId}": {
            get: {
                summary: "Get edge",
                parameters: [
                    {
                        name: "edgeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Edge details",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Edge" },
                            },
                        },
                    },
                    "404": { description: "Not found" },
                },
            },
            patch: {
                summary: "Update edge",
                parameters: [
                    {
                        name: "edgeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    layerId: { type: "string", format: "uuid" },
                                    from: { type: "string", format: "uuid" },
                                    to: { type: "string", format: "uuid" },
                                    props: { type: "object" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Edge updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Edge" },
                            },
                        },
                    },
                    "400": { description: "Invalid input" },
                    "404": { description: "Not found" },
                },
            },
            delete: {
                summary: "Delete edge",
                parameters: [
                    {
                        name: "edgeId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    "204": { description: "Edge deleted" },
                },
            },
        },
        "/dev/schema/reset": {
            post: {
                summary: "Reset development schema",
                description: "Drops and recreates all database objects. Disabled outside development.",
                responses: {
                    "200": {
                        description: "Schema reset successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                        action: { type: "string", example: "reset" },
                                    },
                                },
                            },
                        },
                    },
                    "403": {
                        description: "Endpoint disabled",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Dev schema endpoints disabled" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/dev/schema/create": {
            post: {
                summary: "Create development schema",
                description: "Creates all database objects without dropping existing ones.",
                responses: {
                    "200": {
                        description: "Schema created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                        action: { type: "string", example: "create" },
                                    },
                                },
                            },
                        },
                    },
                    "403": {
                        description: "Endpoint disabled",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Dev schema endpoints disabled" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/dev/schema/drop": {
            post: {
                summary: "Drop development schema",
                description: "Drops all database objects created for development.",
                responses: {
                    "200": {
                        description: "Schema dropped successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                        action: { type: "string", example: "drop" },
                                    },
                                },
                            },
                        },
                    },
                    "403": {
                        description: "Endpoint disabled",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Dev schema endpoints disabled" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            EnvSnapshot: {
                type: "object",
                properties: {
                    timestamp: { type: "string", format: "date-time" },
                    hostname: { type: "string" },
                    arch: { type: "string" },
                    platform: { type: "string" },
                    release: { type: "string" },
                    type: { type: "string" },
                    systemUptimeSeconds: { type: "number", format: "float" },
                    loadAverages: {
                        type: "array",
                        items: { type: "number", format: "float" },
                        description: "1, 5, and 15 minute system load averages.",
                    },
                    totalMemoryBytes: { type: "number", format: "double" },
                    freeMemoryBytes: { type: "number", format: "double" },
                    usedMemoryBytes: { type: "number", format: "double" },
                    memoryUsage: { $ref: "#/components/schemas/EnvMemoryUsage" },
                    cpuCount: { type: "integer", minimum: 0 },
                    cpus: {
                        type: "array",
                        items: { $ref: "#/components/schemas/EnvCpuSummary" },
                    },
                    processInfo: { $ref: "#/components/schemas/EnvProcessInfo" },
                    userInfo: { $ref: "#/components/schemas/EnvUserInfo" },
                    networkInterfaces: {
                        type: "array",
                        items: { $ref: "#/components/schemas/EnvNetworkInterface" },
                    },
                    envSummary: { $ref: "#/components/schemas/EnvEnvSummary" },
                },
            },
            EnvMemoryUsage: {
                type: "object",
                properties: {
                    rss: { type: "number", format: "double" },
                    heapTotal: { type: "number", format: "double" },
                    heapUsed: { type: "number", format: "double" },
                    external: { type: "number", format: "double" },
                    arrayBuffers: { type: "number", format: "double" },
                },
            },
            EnvCpuSummary: {
                type: "object",
                properties: {
                    model: { type: "string" },
                    speedMhz: { type: "number", format: "float" },
                    times: { $ref: "#/components/schemas/EnvCpuTimes" },
                },
            },
            EnvCpuTimes: {
                type: "object",
                properties: {
                    user: { type: "number", format: "double" },
                    nice: { type: "number", format: "double" },
                    sys: { type: "number", format: "double" },
                    idle: { type: "number", format: "double" },
                    irq: { type: "number", format: "double" },
                },
            },
            EnvProcessInfo: {
                type: "object",
                properties: {
                    pid: { type: "integer", minimum: 0 },
                    nodeVersion: { type: "string" },
                    uptimeSeconds: { type: "number", format: "float" },
                    cwd: { type: "string" },
                    argv: {
                        type: "array",
                        items: { type: "string" },
                    },
                    execPath: { type: "string" },
                    versions: {
                        type: "object",
                        additionalProperties: { type: "string" },
                    },
                },
            },
            EnvUserInfo: {
                type: "object",
                properties: {
                    username: { type: "string" },
                    homedir: { type: "string" },
                    shell: { type: "string" },
                },
            },
            EnvNetworkInterface: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    family: { type: "string" },
                    mac: { type: "string" },
                    internal: { type: "boolean" },
                    netmask: { type: "string" },
                    cidr: { type: "string", nullable: true },
                },
            },
            EnvEnvSummary: {
                type: "object",
                properties: {
                    totalVariables: { type: "integer", minimum: 0 },
                    keysSample: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
            },
            Tree: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            Layer: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            Edge: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    layer_id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    from: { type: "string", format: "uuid" },
                    to: { type: "string", format: "uuid" },
                    props: { type: "object" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            TreeNode: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    tree_id: { type: "string", format: "uuid" },
                    parent_id: { type: "string", nullable: true },
                    category_id: { type: "string", nullable: true },
                    name: { type: "string" },
                    position: { type: "integer" },
                    euler_left: { type: "integer", minimum: 0 },
                    euler_right: { type: "integer", minimum: 0 },
                    euler_depth: { type: "integer", minimum: 0 },
                    props: { type: "object" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            TreeNodeWithDepth: {
                allOf: [
                    { $ref: "#/components/schemas/TreeNode" },
                    {
                        type: "object",
                        properties: {
                            depth: {
                                type: "integer",
                                minimum: 0,
                                description: "Relative depth from the requested node.",
                            },
                        },
                    },
                ],
            },
            NodeCategory: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    parent_id: { type: "string", nullable: true },
                    name: { type: "string" },
                    props: { type: "object" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            NodeCategoryCreateRequest: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Folder" },
                    parentId: { type: "string", nullable: true, description: "Parent node category id." },
                    props: { type: "object", description: "Optional metadata for the node category." },
                },
            },
            NodeCategoryUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string", example: "Updated name" },
                    parentId: { type: "string", nullable: true },
                    props: { type: "object" },
                },
            },
            MetricsSnapshot: {
                type: "object",
                properties: {
                    latency: {
                        type: "object",
                        additionalProperties: { $ref: "#/components/schemas/LatencyStat" },
                    },
                },
            },
            LatencyStat: {
                type: "object",
                properties: {
                    count: { type: "integer", minimum: 0 },
                    minMs: { type: "number", format: "float" },
                    maxMs: { type: "number", format: "float" },
                    avgMs: { type: "number", format: "float" },
                },
            },
        },
    },
};

export const mountSwagger = (app: Express): void => {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/swagger.json", (_req: Request, res: Response) => {
        res.json(swaggerSpec);
    });
};
