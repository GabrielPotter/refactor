import type {
  ColumnType,
  Generated,
  Selectable,
  Insertable,
  Updateable,
} from "kysely";
import type { JSONColumnType } from "kysely";

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [k: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export interface TreeTable {
  id: Generated<string>; // uuid (gen_random_uuid)
  name: string;
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface LayerTable {
  id: Generated<string>;
  name: string;
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface NodeProps {
  type?: "folder" | "item";
  tags?: string[];
  [k: string]: JsonValue | undefined;
}

export interface NodeTable {
  id: Generated<string>;      // uuid
  tree_id: string;            // FK -> tree.id
  parent_id: string | null;   // self-FK (within the same tree)
  category_id: string | null; // FK -> node_categories.id
  name: string;
  position: number;
  euler_left: number;         // Euler-tour entry index
  euler_right: number;        // Euler-tour exit index
  euler_depth: number;        // cached depth for fast lookups
  props: JSONColumnType<NodeProps>; // JSONB
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface EdgeProps {
  type?: "folder" | "item";
  tags?: string[];
}

export interface EdgeTable {
  id: Generated<string>;      // uuid
  layer_id: string;           // FK -> layer.id
  name: string;
  from: string;               // FK -> node.id
  to: string;                 // FK -> node.id
  props: JSONColumnType<EdgeProps>; // JSONB
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface NodeCategoryProps {
  [k: string]: JsonValue | undefined;
}

export interface NodeCategoryTable {
  id: Generated<string>;      // uuid
  parent_id: string | null;   // self-FK -> node_categories.id
  name: string;
  props: JSONColumnType<NodeCategoryProps>; // JSONB
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface DB {
  layer: LayerTable;
  edge: EdgeTable;
  tree: TreeTable;
  node: NodeTable;
  node_categories: NodeCategoryTable;
}

// Convenience aliases
export type Tree       = Selectable<TreeTable>;
export type NewTree    = Insertable<TreeTable>;
export type TreePatch  = Updateable<TreeTable>;

export type Layer      = Selectable<LayerTable>;
export type NewLayer   = Insertable<LayerTable>;
export type LayerPatch = Updateable<LayerTable>;

export type Edge       = Selectable<EdgeTable>;
export type NewEdge    = Insertable<EdgeTable>;
export type EdgePatch  = Updateable<EdgeTable>;

export type Node        = Selectable<NodeTable>;
export type NewNode     = Insertable<NodeTable>;
export type NodePatch   = Updateable<NodeTable>;

export type NodeCategory       = Selectable<NodeCategoryTable>;
export type NewNodeCategory    = Insertable<NodeCategoryTable>;
export type NodeCategoryPatch  = Updateable<NodeCategoryTable>;

// Legacy aliases
// export type TreeNodeProps = NodeProps;
// export type TreeNodeTable = NodeTable;
// export type TreeNode = Node;
// export type NewTreeNode = NewNode;
// export type TreeNodePatch = NodePatch;

// export type NodeTypeProps = NodeCategoryProps;
// export type NodeTypeTable = NodeCategoryTable;
// export type NodeType = NodeCategory;
// export type NewNodeType = NewNodeCategory;
// export type NodeTypePatch = NodeCategoryPatch;
