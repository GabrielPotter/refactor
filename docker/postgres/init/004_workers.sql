-- worker tables

-- node table
DROP TABLE IF EXISTS node CASCADE;

CREATE TABLE node(
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    parent_id       uuid REFERENCES node(id) ON DELETE SET NULL,
    tree_id         uuid REFERENCES tree(id) ON DELETE CASCADE,
    category_id     uuid REFERENCES node_category(id) ON DELETE CASCADE,
    type_id         uuid REFERENCES node_types(id) ON DELETE CASCADE,
    props           jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_leaf         boolean NOT NULL,
    depth           int NOT NULL,
    euler_in        int NOT NULL,
    euler_out       int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_node_name ON node(name);
CREATE TRIGGER trg_node_set_updated_at BEFORE
UPDATE ON node FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- btree/Euler
CREATE INDEX ix_node_tree_in_out ON node(tree_id, euler_in, euler_out);
CREATE INDEX ix_node_parent      ON node(tree_id, parent_id);
CREATE INDEX ix_node_depth       ON node(tree_id, depth);

-- [PG] részleges index levelekre (olvasás gyorsításához)
CREATE INDEX ix_node_leaf_in     ON node(tree_id, euler_in) WHERE is_leaf;

DROP TABLE IF EXISTS edge CASCADE;

CREATE TABLE edge(
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    layer_id        uuid REFERENCES layer(id) ON DELETE CASCADE,
    a_tree_id       uuid REFERENCES tree(id) ON DELETE CASCADE,
    a_node_id       uuid REFERENCES node(id) ON DELETE CASCADE,
    b_tree_id       uuid REFERENCES tree(id) ON DELETE CASCADE,
    b_node_id       uuid REFERENCES node(id) ON DELETE CASCADE,
    category_id     uuid REFERENCES edge_category(id) ON DELETE CASCADE,
    type_id         uuid REFERENCES edge_types(id) ON DELETE CASCADE,
    props           jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT edge_endpoints_order CHECK ((a_tree_id, a_node_id) <= (b_tree_id, b_node_id)),
    CONSTRAINT edge_no_self CHECK (NOT (a_tree_id = b_tree_id AND a_node_id = b_node_id))
);

CREATE INDEX idx_edge_name ON edge(name);
CREATE UNIQUE INDEX ux_edge_layer_pair
  ON edge(layer_id, a_tree_id, a_node_id, b_tree_id, b_node_id);
CREATE INDEX ix_edge_layer_a  ON edge(layer_id, a_tree_id, a_node_id);
CREATE INDEX ix_edge_layer_b  ON edge(layer_id, b_tree_id, b_node_id);
CREATE INDEX ix_edge_layer_ab ON edge(layer_id, a_tree_id, b_tree_id, a_node_id, b_node_id);
CREATE TRIGGER trg_edge_set_updated_at BEFORE
UPDATE ON edge FOR EACH ROW EXECUTE FUNCTION set_updated_at();
