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
    await sql`DROP TABLE IF EXISTS tree_node CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS tree CASCADE;`.execute(db);
    await sql`DROP TABLE IF EXISTS layer CASCADE;`.execute(db);
    // Drop any additional helper functions here if you added them.
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

    // --- layer ---
    await sql`
      CREATE TABLE layer (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_layer_set_updated_at
      BEFORE UPDATE ON layer
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- tree ---
    await sql`
      CREATE TABLE tree (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_tree_set_updated_at
      BEFORE UPDATE ON tree
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- tree_node ---
    await sql`
      CREATE TABLE tree_node (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tree_id    uuid NOT NULL REFERENCES tree(id) ON DELETE CASCADE,
        parent_id  uuid NULL,
        name       text NOT NULL,
        position   integer NOT NULL DEFAULT 0,
        props      jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    // Unique key (id, tree_id) for the composite self-FK
    await sql`
      CREATE UNIQUE INDEX ux_tree_node_id_tree ON tree_node (id, tree_id);
    `.execute(db);

    // Parent within the same tree: (parent_id, tree_id) -> (id, tree_id)
    await sql`
      ALTER TABLE tree_node
      ADD CONSTRAINT fk_tree_node_parent_same_tree
      FOREIGN KEY (parent_id, tree_id)
      REFERENCES tree_node (id, tree_id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE;
    `.execute(db);

    // Faster navigation
    await sql`
      CREATE INDEX idx_tree_node_tree_parent_pos
      ON tree_node (tree_id, parent_id, position);
    `.execute(db);

    await sql`
      CREATE INDEX idx_tree_node_tree_id
      ON tree_node (tree_id);
    `.execute(db);

    // JSONB GIN index for faster filtering
    await sql`
      CREATE INDEX idx_tree_node_props_gin
      ON tree_node
      USING GIN (props);
    `.execute(db);

    // updated_at trigger
    await sql`
      CREATE TRIGGER trg_tree_node_set_updated_at
      BEFORE UPDATE ON tree_node
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);

    // --- edge ---
    await sql`
      CREATE TABLE edge (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        layer_id   uuid NOT NULL REFERENCES layer(id) ON DELETE CASCADE,
        name       text NOT NULL,
        "from"     uuid NOT NULL REFERENCES tree_node(id) ON DELETE CASCADE,
        "to"       uuid NOT NULL REFERENCES tree_node(id) ON DELETE CASCADE,
        props      jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_layer ON edge(layer_id);
    `.execute(db);

    await sql`
      CREATE INDEX idx_edge_from_to ON edge("from", "to");
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_edge_set_updated_at
      BEFORE UPDATE ON edge
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `.execute(db);
  },
};
