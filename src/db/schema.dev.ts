// db/schema.dev.ts
import { Kysely, sql } from "kysely";
import type { DB } from "./types";

/**
 * Development schema helpers:
 * - resetAll(): drops everything and recreates the schema
 * - createAll(): creates the schema on a clean database
 * - dropAll(): drops everything
 *
 * ⚠️ Do NOT call this in production!
 */
export const DevSchema = {
  async resetAll(db: Kysely<DB>) {
    await this.dropAll(db);
    await this.createAll(db);
  },

  async dropAll(db: Kysely<DB>) {
    // Drop tables in order because of triggers and foreign keys
    await sql`DROP TABLE IF EXISTS edge CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS node CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS node_types CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS edge_types CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS edge_category_graph CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS node_category_graph CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS edge_category CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS node_category CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS category CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS tree CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS layer CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS json_schemas CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS app_info CASCADE;`.execute(db);
    await sql`DROP FUNCTION IF EXISTS set_updated_at() CASCADE;`.execute(db);
  },

  async createAll(db: Kysely<DB>) {
    // Extension for the UUID generator
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`.execute(db);

    // updated_at trigger function
    await sql`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `.execute(db);

    // --- app_info ---
    await sql`
      CREATE TABLE app_info (
        name    text PRIMARY KEY,
        version text NOT NULL
      );
    `.execute(db);

    await sql`
      INSERT INTO app_info (name, version)
      VALUES ('refactor', '1.0.0')
      ON CONFLICT (name) DO UPDATE
      SET version = EXCLUDED.version;
    `.execute(db);

    // --- json_schemas ---
    await sql`
      CREATE TABLE json_schemas (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_json_schemas_name
      ON json_schemas (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_json_schemas_set_updated_at
      BEFORE UPDATE ON json_schemas
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- tree ---
    await sql`
      CREATE TABLE tree (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name         text NOT NULL,
        props        jsonb NOT NULL DEFAULT '{}'::jsonb,
        props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
        created_at   timestamptz NOT NULL DEFAULT now(),
        updated_at   timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_tree_name
      ON tree (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_tree_set_updated_at
      BEFORE UPDATE ON tree
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- layer ---
    await sql`
      CREATE TABLE layer (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        props      jsonb NOT NULL DEFAULT '{}'::jsonb,
        props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_layer_name
      ON layer (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_layer_set_updated_at
      BEFORE UPDATE ON layer
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- edge_category ---
    await sql`
      CREATE TABLE edge_category (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_category_name
      ON edge_category (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_edge_category_set_updated_at
      BEFORE UPDATE ON edge_category
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- edge_category_graph ---
    await sql`
      CREATE TABLE edge_category_graph (
        parent_id uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
        child_id  uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
        CONSTRAINT pk_edge_category_graph PRIMARY KEY (parent_id, child_id),
        CONSTRAINT edge_category_not_self_reference CHECK (parent_id <> child_id)
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_category_graph_parent
      ON edge_category_graph (parent_id);
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_category_graph_child
      ON edge_category_graph (child_id);
    `.execute(db);

    // --- node_category ---
    await sql`
      CREATE TABLE node_category (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_node_category_name
      ON node_category (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_node_category_set_updated_at
      BEFORE UPDATE ON node_category
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- node_category_graph ---
    await sql`
      CREATE TABLE node_category_graph (
        parent_id uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
        child_id  uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
        CONSTRAINT pk_node_category_graph PRIMARY KEY (parent_id, child_id),
        CONSTRAINT edge_not_self_reference CHECK (parent_id <> child_id)
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_node_category_graph_parent
      ON node_category_graph (parent_id);
    `.execute(db);

    await sql`
      CREATE INDEX idx_node_category_graph_child
      ON node_category_graph (child_id);
    `.execute(db);

    // --- edge_types ---
    await sql`
      CREATE TABLE edge_types (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        parent_id  uuid REFERENCES edge_category(id) ON DELETE CASCADE,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_types_name
      ON edge_types (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_edge_types_set_updated_at
      BEFORE UPDATE ON edge_types
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- node_types ---
    await sql`
      CREATE TABLE node_types (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        parent_id  uuid REFERENCES node_category(id) ON DELETE CASCADE,
        schema     jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_node_types_name
      ON node_types (name);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_node_types_set_updated_at
      BEFORE UPDATE ON node_types
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- node ---
    await sql`
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
    `.execute(db);

    await sql`
      CREATE INDEX idx_node_name
      ON node (name);
    `.execute(db);

    await sql`
      CREATE INDEX ix_node_tree_in_out
      ON node (tree_id, euler_in, euler_out);
    `.execute(db);

    await sql`
      CREATE INDEX ix_node_parent
      ON node (tree_id, parent_id);
    `.execute(db);

    await sql`
      CREATE INDEX ix_node_depth
      ON node (tree_id, depth);
    `.execute(db);

    await sql`
      CREATE INDEX ix_node_leaf_in
      ON node (tree_id, euler_in) WHERE is_leaf;
    `.execute(db);

    // updated_at trigger
    await sql`
      CREATE TRIGGER trg_node_set_updated_at
      BEFORE UPDATE ON node
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- edge ---
    await sql`
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
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_name
      ON edge (name);
    `.execute(db);

    await sql`
      CREATE UNIQUE INDEX ux_edge_layer_pair
      ON edge (layer_id, a_tree_id, a_node_id, b_tree_id, b_node_id);
    `.execute(db);

    await sql`
      CREATE INDEX ix_edge_layer_a
      ON edge (layer_id, a_tree_id, a_node_id);
    `.execute(db);

    await sql`
      CREATE INDEX ix_edge_layer_b
      ON edge (layer_id, b_tree_id, b_node_id);
    `.execute(db);

    await sql`
      CREATE INDEX ix_edge_layer_ab
      ON edge (layer_id, a_tree_id, b_tree_id, a_node_id, b_node_id);
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_edge_set_updated_at
      BEFORE UPDATE ON edge
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);
  },
};
