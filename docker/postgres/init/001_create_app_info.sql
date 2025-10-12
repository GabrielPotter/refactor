-- signature table

CREATE TABLE IF NOT EXISTS app_info (
  name TEXT PRIMARY KEY,
  version TEXT NOT NULL
);

INSERT INTO app_info (name, version)
VALUES ('refactor', '1.0.0')
ON CONFLICT (name) DO UPDATE SET version = EXCLUDED.version;
