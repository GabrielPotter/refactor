import type {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [k: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

type CreatedAtColumn = ColumnType<Date, Date | string | undefined, never>;
type UpdatedAtColumn = ColumnType<Date, Date | string | undefined, Date | string | undefined>;

type JsonMap = Record<string, JsonValue | undefined>;

export interface AppInfoTable {
  name: string;
  version: string;
}

export interface JsonSchemasTable {
  id: Generated<string>;
  name: string;
  schema: JSONColumnType<JsonMap>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface TreeProps extends JsonMap {}

export interface TreeTable {
  id: Generated<string>; // uuid (gen_random_uuid)
  name: string;
  props: JSONColumnType<TreeProps>;
  props_schema: string;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface LayerProps extends JsonMap {}

export interface LayerTable {
  id: Generated<string>;
  name: string;
  props: JSONColumnType<LayerProps>;
  props_schema: string;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface EdgeCategorySchema extends JsonMap {}

export interface EdgeCategoryTable {
  id: Generated<string>;
  name: string;
  schema: JSONColumnType<EdgeCategorySchema>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface EdgeCategoryGraphTable {
  parent_id: string;
  child_id: string;
}

export interface NodeCategorySchema extends JsonMap {}

export interface NodeCategoryTable {
  id: Generated<string>;
  name: string;
  schema: JSONColumnType<NodeCategorySchema>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface NodeCategoryGraphTable {
  parent_id: string;
  child_id: string;
}

export interface NodeTypeSchema extends JsonMap {}

export interface NodeTypeTable {
  id: Generated<string>;
  name: string;
  parent_id: string | null;
  schema: JSONColumnType<NodeTypeSchema>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface EdgeTypeSchema extends JsonMap {}

export interface EdgeTypeTable {
  id: Generated<string>;
  name: string;
  parent_id: string | null;
  schema: JSONColumnType<EdgeTypeSchema>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface NodeProps extends JsonMap {}

export interface NodeTable {
  id: Generated<string>;
  name: string;
  parent_id: string | null;
  tree_id: string | null;
  category_id: string | null;
  type_id: string | null;
  props: JSONColumnType<NodeProps>;
  is_leaf: boolean;
  depth: number;
  euler_in: number;
  euler_out: number;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface EdgeProps extends JsonMap {}

export interface EdgeTable {
  id: Generated<string>;
  name: string;
  layer_id: string | null;
  a_tree_id: string | null;
  a_node_id: string | null;
  b_tree_id: string | null;
  b_node_id: string | null;
  category_id: string | null;
  type_id: string | null;
  props: JSONColumnType<EdgeProps>;
  created_at: CreatedAtColumn;
  updated_at: UpdatedAtColumn;
}

export interface DB {
  app_info: AppInfoTable;
  json_schemas: JsonSchemasTable;
  tree: TreeTable;
  layer: LayerTable;
  edge_category: EdgeCategoryTable;
  edge_category_graph: EdgeCategoryGraphTable;
  edge_types: EdgeTypeTable;
  node_category: NodeCategoryTable;
  node_category_graph: NodeCategoryGraphTable;
  node_types: NodeTypeTable;
  node: NodeTable;
  edge: EdgeTable;
}

// Convenience aliases
export type AppInfo      = Selectable<AppInfoTable>;
export type NewAppInfo   = Insertable<AppInfoTable>;
export type AppInfoPatch = Updateable<AppInfoTable>;

export type JsonSchema      = Selectable<JsonSchemasTable>;
export type NewJsonSchema   = Insertable<JsonSchemasTable>;
export type JsonSchemaPatch = Updateable<JsonSchemasTable>;

export type Tree       = Selectable<TreeTable>;
export type NewTree    = Insertable<TreeTable>;
export type TreePatch  = Updateable<TreeTable>;

export type Layer      = Selectable<LayerTable>;
export type NewLayer   = Insertable<LayerTable>;
export type LayerPatch = Updateable<LayerTable>;

export type NodeType      = Selectable<NodeTypeTable>;
export type NewNodeType   = Insertable<NodeTypeTable>;
export type NodeTypePatch = Updateable<NodeTypeTable>;

export type EdgeType      = Selectable<EdgeTypeTable>;
export type NewEdgeType   = Insertable<EdgeTypeTable>;
export type EdgeTypePatch = Updateable<EdgeTypeTable>;

export type Edge       = Selectable<EdgeTable>;
export type NewEdge    = Insertable<EdgeTable>;
export type EdgePatch  = Updateable<EdgeTable>;

export type Node       = Selectable<NodeTable>;
export type NewNode    = Insertable<NodeTable>;
export type NodePatch  = Updateable<NodeTable>;

// Legacy aliases
export type TreeNodeProps = NodeProps;
export type TreeNodeTable = NodeTable;
export type TreeNode = Node;
export type NewTreeNode = NewNode;
export type TreeNodePatch = NodePatch;

export type NodeCategory = Selectable<NodeCategoryTable>;
export type NewNodeCategory = Insertable<NodeCategoryTable>;
export type NodeCategoryPatch = Updateable<NodeCategoryTable>;

export type EdgeCategory = Selectable<EdgeCategoryTable>;
export type NewEdgeCategory = Insertable<EdgeCategoryTable>;
export type EdgeCategoryPatch = Updateable<EdgeCategoryTable>;

export type EdgeCategoryGraphEdge = Selectable<EdgeCategoryGraphTable>;
export type NewEdgeCategoryGraphEdge = Insertable<EdgeCategoryGraphTable>;

export type NodeCategoryGraphEdge = Selectable<NodeCategoryGraphTable>;
export type NewNodeCategoryGraphEdge = Insertable<NodeCategoryGraphTable>;
