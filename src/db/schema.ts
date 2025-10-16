import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { JsonMap } from "./json";

export const app_info = pgTable("app_info", {
  name: text("name").primaryKey(),
  version: text("version").notNull(),
});

export const json_schemas = pgTable("json_schemas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  schema: jsonb("schema")
    .$type<JsonMap>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tree = pgTable("tree", {
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
});

export const layer = pgTable("layer", {
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
});

export const edge_category = pgTable("edge_category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  schema: jsonb("schema")
    .$type<JsonMap>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const edge_category_graph = pgTable("edge_category_graph", {
  parent_id: uuid("parent_id")
    .notNull()
    .references(() => edge_category.id, { onDelete: "cascade" }),
  child_id: uuid("child_id")
    .notNull()
    .references(() => edge_category.id, { onDelete: "cascade" }),
});

export const edge_types = pgTable("edge_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parent_id: uuid("parent_id").references(() => edge_category.id, { onDelete: "cascade" }),
  schema: jsonb("schema")
    .$type<JsonMap>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const node_category = pgTable("node_category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  schema: jsonb("schema")
    .$type<JsonMap>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const node_category_graph = pgTable("node_category_graph", {
  parent_id: uuid("parent_id")
    .notNull()
    .references(() => node_category.id, { onDelete: "cascade" }),
  child_id: uuid("child_id")
    .notNull()
    .references(() => node_category.id, { onDelete: "cascade" }),
});

export const node_types = pgTable("node_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parent_id: uuid("parent_id").references(() => node_category.id, { onDelete: "cascade" }),
  schema: jsonb("schema")
    .$type<JsonMap>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  (table) => ({
    parentReference: foreignKey({
      columns: [table.parent_id],
      foreignColumns: [table.id],
      name: "node_parent_id_fkey",
    }).onDelete("set null"),
  }),
);

export const edge = pgTable("edge", {
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
});
