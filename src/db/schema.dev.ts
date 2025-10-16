// db/schema.dev.ts
import { sql } from "drizzle-orm";

import type { Database } from "./client";

/**
 * Development schema helpers:
 * - resetAll(): drops everything and recreates the schema
 * - createAll(): creates the schema on a clean database
 * - dropAll(): drops everything
 *
 * ⚠️ Do NOT call this in production!
 */
export const DevSchema = {
  async resetAll(db: Database) {
    await this.dropAll(db);
    await this.createAll(db);
  },

  async dropAll(db: Database) {
    // Drop tables in order because of triggers and foreign keys
    await db.execute(sql`DROP TABLE IF EXISTS edge CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS node CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS node_types CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS edge_types CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS edge_category_graph CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS node_category_graph CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS edge_category CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS node_category CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS category CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS tree CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS layer CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS json_schemas CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS app_info CASCADE;`);
    await db.execute(sql`DROP FUNCTION IF EXISTS set_updated_at() CASCADE;`);
  },

  async createAll(db: Database) {
    // Extension for the UUID generator
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // updated_at trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);

    // --- app_info ---
    await db.execute(sql`
      CREATE TABLE app_info (
        name    text PRIMARY KEY,
        version text NOT NULL
      );
    `);

    await db.execute(sql`
      INSERT INTO app_info (name, version)
      VALUES ('refactor', '1.0.0')
      ON CONFLICT (name) DO UPDATE
      SET version = EXCLUDED.version;
    `);

    // --- json_schemas ---
    await db.execute(sql`
      CREATE TABLE json_schemas (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_json_schemas_name
      ON json_schemas (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_json_schemas_set_updated_at
      BEFORE UPDATE ON json_schemas
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- tree ---
    await db.execute(sql`
      CREATE TABLE tree (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name         text NOT NULL,
        props        jsonb NOT NULL DEFAULT '{}'::jsonb,
        props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
        created_at   timestamptz NOT NULL DEFAULT now(),
        updated_at   timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_tree_name
      ON tree (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_tree_set_updated_at
      BEFORE UPDATE ON tree
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- layer ---
    await db.execute(sql`
      CREATE TABLE layer (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        props      jsonb NOT NULL DEFAULT '{}'::jsonb,
        props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_layer_name
      ON layer (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_layer_set_updated_at
      BEFORE UPDATE ON layer
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- edge_category ---
    await db.execute(sql`
      CREATE TABLE edge_category (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_edge_category_name
      ON edge_category (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_edge_category_set_updated_at
      BEFORE UPDATE ON edge_category
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- edge_category_graph ---
    await db.execute(sql`
      CREATE TABLE edge_category_graph (
        parent_id uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
        child_id  uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
        CONSTRAINT pk_edge_category_graph PRIMARY KEY (parent_id, child_id),
        CONSTRAINT edge_category_not_self_reference CHECK (parent_id <> child_id)
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_edge_category_graph_parent
      ON edge_category_graph (parent_id);
    `);

    await db.execute(sql`
      CREATE INDEX idx_edge_category_graph_child
      ON edge_category_graph (child_id);
    `);

    // --- node_category ---
    await db.execute(sql`
      CREATE TABLE node_category (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_node_category_name
      ON node_category (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_node_category_set_updated_at
      BEFORE UPDATE ON node_category
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- node_category_graph ---
    await db.execute(sql`
      CREATE TABLE node_category_graph (
        parent_id uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
        child_id  uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
        CONSTRAINT pk_node_category_graph PRIMARY KEY (parent_id, child_id),
        CONSTRAINT edge_not_self_reference CHECK (parent_id <> child_id)
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_node_category_graph_parent
      ON node_category_graph (parent_id);
    `);

    await db.execute(sql`
      CREATE INDEX idx_node_category_graph_child
      ON node_category_graph (child_id);
    `);

    // --- edge_types ---
    await db.execute(sql`
      CREATE TABLE edge_types (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        parent_id  uuid REFERENCES edge_category(id) ON DELETE CASCADE,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_edge_types_name
      ON edge_types (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_edge_types_set_updated_at
      BEFORE UPDATE ON edge_types
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- node_types ---
    await db.execute(sql`
      CREATE TABLE node_types (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        parent_id  uuid REFERENCES node_category(id) ON DELETE CASCADE,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX idx_node_types_name
      ON node_types (name);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_node_types_set_updated_at
      BEFORE UPDATE ON node_types
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- node ---
    await db.execute(sql`
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
    `);

    await db.execute(sql`
      CREATE INDEX idx_node_name
      ON node (name);
    `);

    await db.execute(sql`
      CREATE INDEX ix_node_tree_in_out
      ON node (tree_id, euler_in, euler_out);
    `);

    await db.execute(sql`
      CREATE INDEX ix_node_parent
      ON node (tree_id, parent_id);
    `);

    await db.execute(sql`
      CREATE INDEX ix_node_depth
      ON node (tree_id, depth);
    `);

    await db.execute(sql`
      CREATE INDEX ix_node_leaf_in
      ON node (tree_id, euler_in) WHERE is_leaf;
    `);

    // updated_at trigger
    await db.execute(sql`
      CREATE TRIGGER trg_node_set_updated_at
      BEFORE UPDATE ON node
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // --- edge ---
    await db.execute(sql`
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
    `);

    await db.execute(sql`
      CREATE INDEX idx_edge_name
      ON edge (name);
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX ux_edge_layer_pair
      ON edge (layer_id, a_tree_id, a_node_id, b_tree_id, b_node_id);
    `);

    await db.execute(sql`
      CREATE INDEX ix_edge_layer_a
      ON edge (layer_id, a_tree_id, a_node_id);
    `);

    await db.execute(sql`
      CREATE INDEX ix_edge_layer_b
      ON edge (layer_id, b_tree_id, b_node_id);
    `);

    await db.execute(sql`
      CREATE INDEX ix_edge_layer_ab
      ON edge (layer_id, a_tree_id, b_tree_id, a_node_id, b_node_id);
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_edge_set_updated_at
      BEFORE UPDATE ON edge
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  },
};
