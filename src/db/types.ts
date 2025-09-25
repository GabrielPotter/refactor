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

export interface TreeNodeProps {
  type?: "folder" | "item";
  tags?: string[];
  [k: string]: JsonValue | undefined;
}

export interface TreeNodeTable {
  id: Generated<string>;      // uuid
  tree_id: string;            // FK -> tree.id
  parent_id: string | null;   // self-FK (within the same tree)
  name: string;
  position: number;
  props: JSONColumnType<TreeNodeProps>; // JSONB
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
  from: string;               // FK -> tree_node.id
  to: string;                 // FK -> tree_node.id
  props: JSONColumnType<EdgeProps>; // JSONB
  created_at: ColumnType<Date, undefined, never>;
  updated_at: ColumnType<Date, undefined, Date>;
}

export interface DB {
  layer: LayerTable;
  edge: EdgeTable;
  tree: TreeTable;
  tree_node: TreeNodeTable;
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

export type TreeNode       = Selectable<TreeNodeTable>;
export type NewTreeNode    = Insertable<TreeNodeTable>;
export type TreeNodePatch  = Updateable<TreeNodeTable>;
