-- +goose Up
-- Feed reads search a circle over a time window. One index on both columns
-- costs about the rows inside the window, however many match the circle.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE INDEX items_geog_time_gix ON items USING gist (geog, published_at) WHERE status = 'active';

-- Nothing reads these any more, and each one slows every write.
DROP INDEX items_geog_gix;
DROP INDEX items_cell_time;

-- +goose Down
CREATE INDEX items_cell_time ON items (h3_r8, published_at DESC, id DESC) WHERE status = 'active';
CREATE INDEX items_geog_gix ON items USING gist (geog) WHERE status = 'active';
DROP INDEX items_geog_time_gix;
