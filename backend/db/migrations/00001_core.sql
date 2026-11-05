-- +goose Up
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_user_id text UNIQUE,
  legacy_email citext UNIQUE,
  username text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL,
  external_id text,
  kind text NOT NULL CHECK (kind IN ('post', 'video', 'live', 'event', 'article', 'alert')),
  author_user_id bigint REFERENCES users (id),
  author_name text,
  author_url text,
  author_avatar_url text,
  title text NOT NULL,
  body text,
  url text,
  media jsonb NOT NULL DEFAULT '[]',
  geog geography (Point, 4326) NOT NULL,
  geo_method text NOT NULL CHECK (geo_method IN (
    'device', 'venue', 'source_tagged', 'source_place', 'query_area', 'channel_home'
  )),
  geo_confidence real NOT NULL CHECK (geo_confidence BETWEEN 0 AND 1),
  geo_radius_m integer NOT NULL DEFAULT 0,
  place_name text,
  h3_r8 bigint NOT NULL,
  h3_r5 bigint NOT NULL,
  published_at timestamptz NOT NULL,
  fetched_at timestamptz,
  refresh_by timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  points integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  source_meta jsonb NOT NULL DEFAULT '{}',
  UNIQUE (source, external_id)
);

CREATE INDEX items_geog_gix ON items USING gist (geog) WHERE status = 'active';
CREATE INDEX items_cell_time ON items (h3_r8, published_at DESC, id DESC) WHERE status = 'active';
CREATE INDEX items_refresh ON items (refresh_by) WHERE refresh_by IS NOT NULL;
CREATE INDEX items_author ON items (author_user_id, published_at DESC);

CREATE TABLE cell_state (
  source text NOT NULL,
  h3_r5 bigint NOT NULL,
  last_refreshed_at timestamptz,
  last_result_count integer NOT NULL DEFAULT 0,
  next_page_token text,
  consecutive_failures integer NOT NULL DEFAULT 0,
  PRIMARY KEY (source, h3_r5)
);

-- +goose Down
DROP TABLE cell_state;
DROP TABLE items;
DROP TABLE users;
