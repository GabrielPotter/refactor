-- helper tables
-- schema table 
DROP TABLE IF EXISTS json_schemas CASCADE;
CREATE TABLE json_schemas(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_json_schemas_name ON json_schemas(name);
CREATE TRIGGER trg_json_schemas_set_updated_at BEFORE
UPDATE ON json_schemas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- tree table 
DROP TABLE IF EXISTS tree CASCADE;
CREATE TABLE tree(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    props jsonb NOT NULL DEFAULT '{}'::jsonb,
    props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tree_name ON tree(name);
CREATE TRIGGER trg_tree_set_updated_at BEFORE
UPDATE on tree FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- layer table
DROP TABLE IF EXISTS layer CASCADE;
CREATE TABLE layer(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    props jsonb NOT NULL DEFAULT '{}'::jsonb,
    props_schema uuid NOT NULL REFERENCES json_schemas(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_layer_name ON layer(name);
CREATE TRIGGER trg_layer_set_updated_at BEFORE
UPDATE on layer FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- edge_category table
DROP TABLE IF EXISTS edge_category_graph CASCADE;
DROP TABLE IF EXISTS edge_category CASCADE;
CREATE TABLE edge_category(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_edge_category_name ON edge_category(name);
CREATE TRIGGER trg_edge_category_set_updated_at BEFORE
UPDATE ON edge_category FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE edge_category_graph(
    parent_id uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
    child_id uuid NOT NULL REFERENCES edge_category(id) ON DELETE CASCADE,
    CONSTRAINT pk_edge_category_graph PRIMARY KEY (parent_id, child_id),
    CONSTRAINT edge_category_not_self_reference CHECK (parent_id <> child_id)
);
CREATE INDEX idx_edge_category_graph_parent ON edge_category_graph(parent_id);
CREATE INDEX idx_edge_category_graph_child ON edge_category_graph(child_id);

-- edge_types table
DROP TABLE IF EXISTS edge_types CASCADE;
CREATE TABLE edge_types(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES edge_category(id) ON DELETE CASCADE,
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_edge_types_name ON edge_types(name);
CREATE TRIGGER trg_edge_types_set_updated_at BEFORE
UPDATE ON edge_types FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- node_category table 
DROP TABLE IF EXISTS node_category CASCADE;
CREATE TABLE node_category(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_node_category_name ON node_category(name);
CREATE TRIGGER trg_node_category_set_updated_at BEFORE
UPDATE ON node_category FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TABLE IF EXISTS node_category_graph CASCADE;
CREATE TABLE node_category_graph(
    parent_id uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
    child_id uuid NOT NULL REFERENCES node_category(id) ON DELETE CASCADE,
    CONSTRAINT pk_node_category_graph PRIMARY KEY (parent_id, child_id),
    CONSTRAINT edge_not_self_reference CHECK (parent_id <> child_id)
);
CREATE INDEX idx_node_category_graph_parent ON node_category_graph(parent_id);
CREATE INDEX idx_node_category_graph_child ON node_category_graph(child_id);

-- node_types table
DROP TABLE IF EXISTS node_types CASCADE;
CREATE TABLE node_types(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES node_category(id) ON DELETE CASCADE,
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_node_types_name ON node_types(name);
CREATE TRIGGER trg_node_types_set_updated_at BEFORE
UPDATE ON node_types FOR EACH ROW EXECUTE FUNCTION set_updated_at();
