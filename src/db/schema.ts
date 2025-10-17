import { getTableName, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { JsonMap } from "./json";
import type { Database } from "./client";

export const app_info = pgTable("app_info", {
  name: text("name").primaryKey(),
  version: text("version").notNull(),
});

export const json_schemas = pgTable(
  "json_schemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    schema: jsonb("schema")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_json_schemas_name").on(table.name)],
);

export const tree = pgTable(
  "tree",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    props: jsonb("props")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    props_schema: uuid("props_schema")
      .notNull()
      .references(() => json_schemas.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_tree_name").on(table.name)],
);

export const layer = pgTable(
  "layer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    props: jsonb("props")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    props_schema: uuid("props_schema")
      .notNull()
      .references(() => json_schemas.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_layer_name").on(table.name)],
);

export const edge_category = pgTable(
  "edge_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    schema: jsonb("schema")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_edge_category_name").on(table.name)],
);

export const edge_category_graph = pgTable(
  "edge_category_graph",
  {
    parent_id: uuid("parent_id")
      .notNull()
      .references(() => edge_category.id, { onDelete: "cascade" }),
    child_id: uuid("child_id")
      .notNull()
      .references(() => edge_category.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.parent_id, table.child_id], name: "pk_edge_category_graph" }),
    index("idx_edge_category_graph_parent").on(table.parent_id),
    index("idx_edge_category_graph_child").on(table.child_id),
    check("edge_category_not_self_reference", sql`${table.parent_id} <> ${table.child_id}`),
  ],
);

export const edge_types = pgTable(
  "edge_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    parent_id: uuid("parent_id").references(() => edge_category.id, { onDelete: "cascade" }),
    schema: jsonb("schema")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_edge_types_name").on(table.name)],
);

export const node_category = pgTable(
  "node_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    schema: jsonb("schema")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_node_category_name").on(table.name)],
);

export const node_category_graph = pgTable(
  "node_category_graph",
  {
    parent_id: uuid("parent_id")
      .notNull()
      .references(() => node_category.id, { onDelete: "cascade" }),
    child_id: uuid("child_id")
      .notNull()
      .references(() => node_category.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.parent_id, table.child_id], name: "pk_node_category_graph" }),
    index("idx_node_category_graph_parent").on(table.parent_id),
    index("idx_node_category_graph_child").on(table.child_id),
    check("edge_not_self_reference", sql`${table.parent_id} <> ${table.child_id}`),
  ],
);

export const node_types = pgTable(
  "node_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    parent_id: uuid("parent_id").references(() => node_category.id, { onDelete: "cascade" }),
    schema: jsonb("schema")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_node_types_name").on(table.name)],
);

export const node = pgTable(
  "node",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    parent_id: uuid("parent_id"),
    tree_id: uuid("tree_id").references(() => tree.id, { onDelete: "cascade" }),
    category_id: uuid("category_id").references(() => node_category.id, { onDelete: "cascade" }),
    type_id: uuid("type_id").references(() => node_types.id, { onDelete: "cascade" }),
    props: jsonb("props")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    is_leaf: boolean("is_leaf").notNull(),
    depth: integer("depth").notNull(),
    euler_in: integer("euler_in").notNull(),
    euler_out: integer("euler_out").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.parent_id],
      foreignColumns: [table.id],
      name: "node_parent_id_fkey",
    }).onDelete("set null"),
    index("idx_node_name").on(table.name),
    index("ix_node_tree_in_out").on(table.tree_id, table.euler_in, table.euler_out),
    index("ix_node_parent").on(table.tree_id, table.parent_id),
    index("ix_node_depth").on(table.tree_id, table.depth),
    index("ix_node_leaf_in").on(table.tree_id, table.euler_in).where(sql`${table.is_leaf} = true`),
  ],
);

export const edge = pgTable(
  "edge",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    layer_id: uuid("layer_id").references(() => layer.id, { onDelete: "cascade" }),
    a_tree_id: uuid("a_tree_id").references(() => tree.id, { onDelete: "cascade" }),
    a_node_id: uuid("a_node_id").references(() => node.id, { onDelete: "cascade" }),
    b_tree_id: uuid("b_tree_id").references(() => tree.id, { onDelete: "cascade" }),
    b_node_id: uuid("b_node_id").references(() => node.id, { onDelete: "cascade" }),
    category_id: uuid("category_id").references(() => edge_category.id, { onDelete: "cascade" }),
    type_id: uuid("type_id").references(() => edge_types.id, { onDelete: "cascade" }),
    props: jsonb("props")
      .$type<JsonMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_edge_name").on(table.name),
    uniqueIndex("ux_edge_layer_pair").on(
      table.layer_id,
      table.a_tree_id,
      table.a_node_id,
      table.b_tree_id,
      table.b_node_id,
    ),
    index("ix_edge_layer_a").on(table.layer_id, table.a_tree_id, table.a_node_id),
    index("ix_edge_layer_b").on(table.layer_id, table.b_tree_id, table.b_node_id),
    index("ix_edge_layer_ab").on(
      table.layer_id,
      table.a_tree_id,
      table.b_tree_id,
      table.a_node_id,
      table.b_node_id,
    ),
    check(
      "edge_endpoints_order",
      sql`(${table.a_tree_id}, ${table.a_node_id}) <= (${table.b_tree_id}, ${table.b_node_id})`,
    ),
    check(
      "edge_no_self",
      sql`NOT (${table.a_tree_id} = ${table.b_tree_id} AND ${table.a_node_id} = ${table.b_node_id})`,
    ),
  ],
);

const DEV_PREREQUISITES = [
  sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
  sql`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
  `,
];

const DEV_TABLES = [
  {
    name: getTableName(app_info),
    createStatements: [
      sql`
        CREATE TABLE app_info (
          name    text PRIMARY KEY,
          version text NOT NULL
        );
      `,
      sql`
        INSERT INTO app_info (name, version)
        VALUES ('refactor', '1.0.0')
        ON CONFLICT (name) DO UPDATE
        SET version = EXCLUDED.version;
      `,
    ],
  },
  {
    name: getTableName(json_schemas),
    createStatements: [
      sql`
        CREATE TABLE json_schemas (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       text NOT NULL,
          schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_json_schemas_name
        ON json_schemas (name);
      `,
      sql`
        CREATE TRIGGER trg_json_schemas_set_updated_at
        BEFORE UPDATE ON json_schemas
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(tree),
    createStatements: [
      sql`
        CREATE TABLE tree (
          id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name         text NOT NULL,
          props        jsonb NOT NULL DEFAULT '{}'::jsonb,
          props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
          created_at   timestamptz NOT NULL DEFAULT now(),
          updated_at   timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_tree_name
        ON tree (name);
      `,
      sql`
        CREATE TRIGGER trg_tree_set_updated_at
        BEFORE UPDATE ON tree
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(layer),
    createStatements: [
      sql`
        CREATE TABLE layer (
          id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name         text NOT NULL,
          props        jsonb NOT NULL DEFAULT '{}'::jsonb,
          props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
          created_at   timestamptz NOT NULL DEFAULT now(),
          updated_at   timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_layer_name
        ON layer (name);
      `,
      sql`
        CREATE TRIGGER trg_layer_set_updated_at
        BEFORE UPDATE ON layer
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(edge_category),
    createStatements: [
      sql`
        CREATE TABLE edge_category (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       text NOT NULL,
          schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_edge_category_name
        ON edge_category (name);
      `,
      sql`
        CREATE TRIGGER trg_edge_category_set_updated_at
        BEFORE UPDATE ON edge_category
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(edge_category_graph),
    createStatements: [
      sql`
        CREATE TABLE edge_category_graph (
          parent_id uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
          child_id  uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
          CONSTRAINT pk_edge_category_graph PRIMARY KEY (parent_id, child_id),
          CONSTRAINT edge_category_not_self_reference CHECK (parent_id <> child_id)
        );
      `,
      sql`
        CREATE INDEX idx_edge_category_graph_parent
        ON edge_category_graph (parent_id);
      `,
      sql`
        CREATE INDEX idx_edge_category_graph_child
        ON edge_category_graph (child_id);
      `,
    ],
  },
  {
    name: getTableName(node_category),
    createStatements: [
      sql`
        CREATE TABLE node_category (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       text NOT NULL,
          schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_node_category_name
        ON node_category (name);
      `,
      sql`
        CREATE TRIGGER trg_node_category_set_updated_at
        BEFORE UPDATE ON node_category
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(node_category_graph),
    createStatements: [
      sql`
        CREATE TABLE node_category_graph (
          parent_id uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
          child_id  uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
          CONSTRAINT pk_node_category_graph PRIMARY KEY (parent_id, child_id),
          CONSTRAINT edge_not_self_reference CHECK (parent_id <> child_id)
        );
      `,
      sql`
        CREATE INDEX idx_node_category_graph_parent
        ON node_category_graph (parent_id);
      `,
      sql`
        CREATE INDEX idx_node_category_graph_child
        ON node_category_graph (child_id);
      `,
    ],
  },
  {
    name: getTableName(edge_types),
    createStatements: [
      sql`
        CREATE TABLE edge_types (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       text NOT NULL,
          parent_id  uuid REFERENCES edge_category(id) ON DELETE CASCADE,
          schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_edge_types_name
        ON edge_types (name);
      `,
      sql`
        CREATE TRIGGER trg_edge_types_set_updated_at
        BEFORE UPDATE ON edge_types
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(node_types),
    createStatements: [
      sql`
        CREATE TABLE node_types (
          id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name       text NOT NULL,
          parent_id  uuid REFERENCES node_category(id) ON DELETE CASCADE,
          schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_node_types_name
        ON node_types (name);
      `,
      sql`
        CREATE TRIGGER trg_node_types_set_updated_at
        BEFORE UPDATE ON node_types
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(node),
    createStatements: [
      sql`
        CREATE TABLE node (
          id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name        text NOT NULL,
          parent_id   uuid REFERENCES node(id) ON DELETE SET NULL,
          tree_id     uuid REFERENCES tree(id) ON DELETE CASCADE,
          category_id uuid REFERENCES node_category(id) ON DELETE CASCADE,
          type_id     uuid REFERENCES node_types(id) ON DELETE CASCADE,
          props       jsonb NOT NULL DEFAULT '{}'::jsonb,
          is_leaf     boolean NOT NULL,
          depth       integer NOT NULL,
          euler_in    integer NOT NULL,
          euler_out   integer NOT NULL,
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now()
        );
      `,
      sql`
        CREATE INDEX idx_node_name
        ON node (name);
      `,
      sql`
        CREATE INDEX ix_node_tree_in_out
        ON node (tree_id, euler_in, euler_out);
      `,
      sql`
        CREATE INDEX ix_node_parent
        ON node (tree_id, parent_id);
      `,
      sql`
        CREATE INDEX ix_node_depth
        ON node (tree_id, depth);
      `,
      sql`
        CREATE INDEX ix_node_leaf_in
        ON node (tree_id, euler_in) WHERE is_leaf;
      `,
      sql`
        CREATE TRIGGER trg_node_set_updated_at
        BEFORE UPDATE ON node
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
  {
    name: getTableName(edge),
    createStatements: [
      sql`
        CREATE TABLE edge (
          id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name        text NOT NULL,
          layer_id    uuid REFERENCES layer(id) ON DELETE CASCADE,
          a_tree_id   uuid REFERENCES tree(id) ON DELETE CASCADE,
          a_node_id   uuid REFERENCES node(id) ON DELETE CASCADE,
          b_tree_id   uuid REFERENCES tree(id) ON DELETE CASCADE,
          b_node_id   uuid REFERENCES node(id) ON DELETE CASCADE,
          category_id uuid REFERENCES edge_category(id) ON DELETE CASCADE,
          type_id     uuid REFERENCES edge_types(id) ON DELETE CASCADE,
          props       jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT edge_endpoints_order CHECK ((a_tree_id, a_node_id) <= (b_tree_id, b_node_id)),
          CONSTRAINT edge_no_self CHECK (NOT (a_tree_id = b_tree_id AND a_node_id = b_node_id))
        );
      `,
      sql`
        CREATE INDEX idx_edge_name
        ON edge (name);
      `,
      sql`
        CREATE UNIQUE INDEX ux_edge_layer_pair
        ON edge (layer_id, a_tree_id, a_node_id, b_tree_id, b_node_id);
      `,
      sql`
        CREATE INDEX ix_edge_layer_a
        ON edge (layer_id, a_tree_id, a_node_id);
      `,
      sql`
        CREATE INDEX ix_edge_layer_b
        ON edge (layer_id, b_tree_id, b_node_id);
      `,
      sql`
        CREATE INDEX ix_edge_layer_ab
        ON edge (layer_id, a_tree_id, b_tree_id, a_node_id, b_node_id);
      `,
      sql`
        CREATE TRIGGER trg_edge_set_updated_at
        BEFORE UPDATE ON edge
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `,
    ],
  },
];

const DEV_TEARDOWN = [sql`DROP FUNCTION IF EXISTS set_updated_at() CASCADE;`];

export const DevSchema = {
  async resetAll(db: Database) {
    await this.dropAll(db);
    await this.createAll(db);
  },

  async dropAll(db: Database) {
    for (const { name } of [...DEV_TABLES].reverse()) {
      await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(name)} CASCADE;`);
    }
    for (const statement of DEV_TEARDOWN) {
      await db.execute(statement);
    }
  },

  async createAll(db: Database) {
    for (const statement of DEV_PREREQUISITES) {
      await db.execute(statement);
    }
    for (const { createStatements } of DEV_TABLES) {
      for (const statement of createStatements) {
        await db.execute(statement);
      }
    }
  },
};
