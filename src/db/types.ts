import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { JsonMap, JsonPrimitive, JsonValue } from "./json";
import * as schema from "./schema";

export { JsonMap, JsonPrimitive, JsonValue };

export type Schema = typeof schema;
export type DB = Schema;
export type Database = NodePgDatabase<Schema>;

export type AppInfoTable = InferSelectModel<typeof schema.app_info>;
export type AppInfo = AppInfoTable;
export type NewAppInfo = InferInsertModel<typeof schema.app_info>;
export type AppInfoPatch = Partial<InferInsertModel<typeof schema.app_info>>;

export type JsonSchemasTable = InferSelectModel<typeof schema.json_schemas>;
export type JsonSchema = JsonSchemasTable;
export type NewJsonSchema = InferInsertModel<typeof schema.json_schemas>;
export type JsonSchemaPatch = Partial<InferInsertModel<typeof schema.json_schemas>>;

export type TreeProps = JsonMap;
export type TreeTable = InferSelectModel<typeof schema.tree>;
export type Tree = TreeTable;
export type NewTree = InferInsertModel<typeof schema.tree>;
export type TreePatch = Partial<InferInsertModel<typeof schema.tree>>;

export type LayerProps = JsonMap;
export type LayerTable = InferSelectModel<typeof schema.layer>;
export type Layer = LayerTable;
export type NewLayer = InferInsertModel<typeof schema.layer>;
export type LayerPatch = Partial<InferInsertModel<typeof schema.layer>>;

export type EdgeCategorySchema = JsonMap;
export type EdgeCategoryTable = InferSelectModel<typeof schema.edge_category>;
export type EdgeCategory = EdgeCategoryTable;
export type NewEdgeCategory = InferInsertModel<typeof schema.edge_category>;
export type EdgeCategoryPatch = Partial<InferInsertModel<typeof schema.edge_category>>;

export type EdgeCategoryGraphTable = InferSelectModel<typeof schema.edge_category_graph>;
export type EdgeCategoryGraphEdge = EdgeCategoryGraphTable;
export type NewEdgeCategoryGraphEdge = InferInsertModel<typeof schema.edge_category_graph>;

export type NodeCategorySchema = JsonMap;
export type NodeCategoryTable = InferSelectModel<typeof schema.node_category>;
export type NodeCategory = NodeCategoryTable;
export type NewNodeCategory = InferInsertModel<typeof schema.node_category>;
export type NodeCategoryPatch = Partial<InferInsertModel<typeof schema.node_category>>;

export type NodeCategoryGraphTable = InferSelectModel<typeof schema.node_category_graph>;
export type NodeCategoryGraphEdge = NodeCategoryGraphTable;
export type NewNodeCategoryGraphEdge = InferInsertModel<typeof schema.node_category_graph>;

export type NodeTypeSchema = JsonMap;
export type NodeTypeTable = InferSelectModel<typeof schema.node_types>;
export type NodeType = NodeTypeTable;
export type NewNodeType = InferInsertModel<typeof schema.node_types>;
export type NodeTypePatch = Partial<InferInsertModel<typeof schema.node_types>>;

export type EdgeTypeSchema = JsonMap;
export type EdgeTypeTable = InferSelectModel<typeof schema.edge_types>;
export type EdgeType = EdgeTypeTable;
export type NewEdgeType = InferInsertModel<typeof schema.edge_types>;
export type EdgeTypePatch = Partial<InferInsertModel<typeof schema.edge_types>>;

export type NodeProps = JsonMap;
export type NodeTable = InferSelectModel<typeof schema.node>;
export type Node = NodeTable;
export type NewNode = InferInsertModel<typeof schema.node>;
export type NodePatch = Partial<InferInsertModel<typeof schema.node>>;

export type EdgeProps = JsonMap;
export type EdgeTable = InferSelectModel<typeof schema.edge>;
export type Edge = EdgeTable;
export type NewEdge = InferInsertModel<typeof schema.edge>;
export type EdgePatch = Partial<InferInsertModel<typeof schema.edge>>;

// Legacy aliases
export type TreeNodeProps = NodeProps;
export type TreeNodeTable = NodeTable;
export type TreeNode = Node;
export type NewTreeNode = NewNode;
export type TreeNodePatch = NodePatch;
