# NearbyFeed Backend

This is the backend server for the NearbyFeed app. It provides the necessary APIs and functionalities for creating, retrieving, and managing feeds and comments in the NearbyFeed app.

## Installation

1. Clone this repository to your local machine.
2. Navigate to the project's root directory.
3. Run the following command to install the required dependencies:

```bash
# Install the packages
$ yarn install
```

## Docker Setup

The NearbyFeed Backend uses Docker for containerization. To build the Docker containers with docker-compose, run the following command:

```bash
# Spin up the Docker containers
$ yarn dc:up
```

The compose stack now includes:

- PostgreSQL on `5432`
- Redis on `6379`
- ClickHouse HTTP on `8123` and native TCP on `9000`
- Grafana on `3001`

Grafana installs the ClickHouse datasource plugin. The local ClickHouse database defaults to `nearbyfeed_observability`.

If another local project already owns those ports, override the host ports without editing the file:

```bash
POSTGRES_HOST_PORT=55433 \
REDIS_HOST_PORT=6381 \
CLICKHOUSE_HTTP_HOST_PORT=8124 \
CLICKHOUSE_NATIVE_HOST_PORT=9001 \
GRAFANA_HOST_PORT=3002 \
docker compose up -d
```

When overriding ports, point the API env at the same host ports, for example `DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:55433/nearbyfeed?schema=public`, `REDIS_PORT=6381`, and `CLICKHOUSE_URL=http://localhost:8124`.

## Database setup

To set up the database, run the following commands:

```bash
# Map your data model to the database schema
$ yarn db:push

# Generate prisma client
$ yarn db:generate
```

## Running the app

```bash
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

npm scripts are also supported in this worktree:

```bash
npm install
npm run start:dev
npm test -- --runInBand
npm run build
```

## Optional environment

These are optional but enable the newer production paths:

```bash
# TinyFish/Mino live nearby enrichment, server-side only
TINYFISH_API_KEY=
TINYFISH_TIMEOUT_MS=20000
TINYFISH_CACHE_TTL_SECONDS=120
# Legacy MINO_* names are still accepted as fallbacks.

# Browser origins allowed to call the API. Production fails closed when unset.
CORS_ORIGINS=https://app.nearbyfeed.com,https://staging.nearbyfeed.com

# ClickHouse product observability
OBSERVABILITY_ENABLED=true
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DATABASE=nearbyfeed_observability
CLICKHOUSE_USER=nearbyfeed
CLICKHOUSE_PASSWORD=nearbyfeed
CLICKHOUSE_TIMEOUT_MS=2000

# Token expiry overrides
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_TTL_SECONDS=2592000

# External auth provider calls
GOOGLE_USERINFO_TIMEOUT_MS=10000

# Shared outbound API calls, including reverse geocoding
API_TIMEOUT_MS=10000
```

## API notes

OAuth bearer tokens must be sent in JSON request bodies, not query strings:

```http
POST /auth/google/callback
Content-Type: application/json

{"token":"<google-access-token>"}
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
