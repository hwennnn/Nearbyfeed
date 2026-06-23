CREATE DATABASE IF NOT EXISTS nearbyfeed_observability;

CREATE TABLE IF NOT EXISTS nearbyfeed_observability.nearbyfeed_events
(
  event_time DateTime64(3),
  event_name LowCardinality(String),
  session_id Nullable(String),
  user_id Nullable(UInt64),
  route Nullable(String),
  properties String
)
ENGINE = MergeTree
PARTITION BY toDate(event_time)
ORDER BY (event_name, event_time);
