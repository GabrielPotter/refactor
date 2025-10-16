import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { JsonMap, JsonPrimitive, JsonValue } from "./json";
import * as schema from "./schema";

export { JsonMap, JsonPrimitive, JsonValue };

export type { Database } from "./client";

export type AppInfo = InferSelectModel<typeof schema.app_info>;
export type NewAppInfo = InferInsertModel<typeof schema.app_info>;
export type AppInfoPatch = Partial<InferInsertModel<typeof schema.app_info>>;

export type JsonSchema = InferSelectModel<typeof schema.json_schemas>;
export type NewJsonSchema = InferInsertModel<typeof schema.json_schemas>;
export type JsonSchemaPatch = Partial<InferInsertModel<typeof schema.json_schemas>>;

export type Tree = InferSelectModel<typeof schema.tree>;
export type NewTree = InferInsertModel<typeof schema.tree>;
export type TreePatch = Partial<InferInsertModel<typeof schema.tree>>;

export type Layer = InferSelectModel<typeof schema.layer>;
export type NewLayer = InferInsertModel<typeof schema.layer>;
export type LayerPatch = Partial<InferInsertModel<typeof schema.layer>>;

export type EdgeCategory = InferSelectModel<typeof schema.edge_category>;
export type NewEdgeCategory = InferInsertModel<typeof schema.edge_category>;
export type EdgeCategoryPatch = Partial<InferInsertModel<typeof schema.edge_category>>;

export type NodeCategory = InferSelectModel<typeof schema.node_category>;
export type NewNodeCategory = InferInsertModel<typeof schema.node_category>;
export type NodeCategoryPatch = Partial<InferInsertModel<typeof schema.node_category>>;

export type NodeType = InferSelectModel<typeof schema.node_types>;
export type NewNodeType = InferInsertModel<typeof schema.node_types>;
export type NodeTypePatch = Partial<InferInsertModel<typeof schema.node_types>>;

export type EdgeType = InferSelectModel<typeof schema.edge_types>;
export type NewEdgeType = InferInsertModel<typeof schema.edge_types>;
export type EdgeTypePatch = Partial<InferInsertModel<typeof schema.edge_types>>;

export type Node = InferSelectModel<typeof schema.node>;
export type NewNode = InferInsertModel<typeof schema.node>;
export type NodePatch = Partial<InferInsertModel<typeof schema.node>>;

export type Edge = InferSelectModel<typeof schema.edge>;
export type NewEdge = InferInsertModel<typeof schema.edge>;
export type EdgePatch = Partial<InferInsertModel<typeof schema.edge>>;
