CREATE TABLE IF NOT EXISTS nearbyfeed_observability.api_requests
(
  event_time DateTime64(3),
  route LowCardinality(String),
  method LowCardinality(String),
  status UInt16,
  duration_ms Float32,
  db_ms Float32,
  cache_hit UInt8,
  request_id String
)
ENGINE = MergeTree
PARTITION BY toDate(event_time)
ORDER BY (route, event_time)
TTL toDateTime(event_time) + INTERVAL 30 DAY;

CREATE TABLE IF NOT EXISTS nearbyfeed_observability.ingest_runs
(
  event_time DateTime64(3),
  source LowCardinality(String),
  cell String,
  calls UInt32,
  items_new UInt32,
  items_updated UInt32,
  quota_used UInt32,
  duration_ms Float32,
  error String
)
ENGINE = MergeTree
PARTITION BY toDate(event_time)
ORDER BY (source, event_time)
TTL toDateTime(event_time) + INTERVAL 90 DAY;
