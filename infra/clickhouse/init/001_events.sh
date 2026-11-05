#!/bin/sh
set -eu

DATABASE="${CLICKHOUSE_DB:-nearbyfeed_observability}"

case "$DATABASE" in
  '' | [0-9]* | *[!A-Za-z0-9_]*)
    echo "Unsafe CLICKHOUSE_DB value: $DATABASE" >&2
    exit 1
    ;;
esac

clickhouse-client --query "CREATE DATABASE IF NOT EXISTS \`${DATABASE}\`"

clickhouse-client --query "
CREATE TABLE IF NOT EXISTS \`${DATABASE}\`.nearbyfeed_events
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
ORDER BY (event_name, event_time)
"
