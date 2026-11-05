# NearbyFeed rebuild plan (branch `rebuild/go-platform`)

> **Corrections from implementation (2026-11-05).** This plan is the original Fable output. Where it disagrees with these notes, the notes win. Evidence is in `perf/baseline.md`.
>
> - **Feed query (section 3):** the `h3_r8 = ANY($cells)` query fails at 25 km. Reads use a GiST index on `(geog, published_at)` with a growing time window, and H3 is no longer in the read path.
> - **Latency (section 0, 2):** the legacy feed is not slow per request. Its problem is a throughput ceiling at 1M rows.
> - **Redis feed cache (section 2, M2):** likely unnecessary, with p95 under 10 ms uncached. Add it only if measurements call for it.
> - **Temporal:** runs on port 7234, not 7233, which Borough already uses locally.
> - **Postgres image:** `imresamu/postgis`, because `postgis/postgis` has no arm64 build.
> - **sqlc:** not used so far. The few queries are plain pgx.

## 0. What I verified

**Code (read, not run):**
- `live.service.ts`: confirmed. A TinyFish stealth-browser run against an X search URL happens inside `GET /live/nearby`, with a 20 s abort and a 120 s Redis cache keyed by location label. With the empty key it returns `[]`, and `useNearbyLiveUpdates` then shows `demoLiveUpdates`, so the live rail currently shows fake content.
- `posts.service.ts findNearbyPosts`: confirmed. It runs a lat/lng box query, filters by haversine in JS, and loops in batches of `PAGE_SIZE.max*2`, with extra queries for the cursor and blocked users.
- Indexes: all 31 migrations contain only unique-key indexes. Nothing covers `latitude`, `longitude`, `createdAt` or `authorId`, so every feed read is a sequential scan.
- Observability: one ClickHouse HTTP insert per API request, which is the wrong write pattern for ClickHouse.
- CI: there is no root `.github`. The only workflows are under `client/.github`, which GitHub does not run, so server and web have no CI.
- Nothing has been measured; M0 fixes that.

**YouTube (official docs, fetched today):**
- `search.list` with `location` + `locationRadius` (max 1000 km, requires `type=video`) is still documented and not deprecated. It matches only videos whose owner set a location in metadata.
- **Quota changed on 1 June 2026:** `search.list` has its own bucket at 1 unit per call with a default of **100 calls/day**. Other read methods share 10,000 units/day; `videos.list` costs 1 unit for up to 50 IDs.
- `recordingDetails.location.*` has been marked deprecated since 2017, though the docs still call it "searchable on public videos". Whether coordinates still come back is unverified without a key; M1 probes it.
- Developer Policies: stored API data must be refreshed or deleted within 30 days (III.E.4). No scraping (III.E.6). No derived data or metrics (III.E.4.h). The player must not be modified or obscured (III.I). YouTube must be clearly attributed (III.F.2). The app must link YouTube's ToS and have a privacy policy that links Google's (III.A).

**Verdict on YouTube geo:** it works but is thin and quota-starved. At 100 searches/day you get roughly one metro at hourly freshness. The design is therefore: geo search for discovery only, cheap channel-upload polling for volume, explicit geo confidence, and a quota extension request filed early.

**Clerk:** `github.com/clerk/clerk-sdk-go/v2` is at v2.8.0 (2 Nov 2026). `clerkhttp.WithHeaderAuthorization` verifies the Bearer JWT, caches JWKS for 1 hour, and supports `AuthorizedPartyMatches` for `azp`. Claims come from `clerk.SessionClaimsFromContext`. Cross-origin clients send the token in the `Authorization` header.

## 1. Architecture

```
 Browser (Vite React SPA, MapLibre, Clerk JS)
   │  REST /v1 (OpenAPI)          ▲ SSE /v1/stream?cells=…
   ▼                              │
 ┌────────────────────── api (Go) ─────────────────────┐
 │ auth (Clerk JWKS) · feed read · writes · SSE fanout │
 └──┬──────────┬───────────────┬──────────────┬────────┘
    │ pgx/sqlc │ cache, demand │ start/signal │ batched events
    ▼          ▼ quota, stream ▼              ▼
 Postgres   Redis           Temporal ──► worker (Go)      ClickHouse ─► Grafana
 +PostGIS   (cache, ZSET    (schedules,   source adapters:  (requests, vitals,
 (truth)    demand, Streams  retries)     YouTube, …        ingest runs, demand)
    ▲        for SSE)                         │
    └──────── upsert items ◄──────────────────┘──► XADD feed:events ─► api ─► SSE
```

Two Go binaries from one module: `api` (stateless HTTP and SSE) and `worker` (Temporal worker hosting the source adapters). One Postgres.

| Piece | Why it stays |
|---|---|
| Postgres 17 + PostGIS | Source of truth; GiST geography index for radius and viewport queries. |
| Redis 7 | Feed page cache, rate limits, quota counters, per-cell demand ZSET, and a Stream as the SSE bus with replay. |
| Temporal | Ingestion needs durable retries, rate-limited activities, schedules and per-cell dedupe by workflow ID. |
| ClickHouse | Latency percentiles, web vitals, ingest analytics, and hourly per-cell demand priors for pre-warming. Existing table and Grafana dashboards carry over. |
| Grafana | Already provisioned on this branch; keep. |
| Object storage (S3 API) | Only from M4, for user post images: MinIO locally, R2 in production. Replaces Cloudinary. |

**Cut:** NestJS, Prisma, passport/JWT/bcrypt, the mail module (Clerk does it), Cloudinary, Mapbox (it needs a token), and TinyFish in the request path. No Kafka or NATS, since Redis Streams is enough. No Prometheus or Tempo: ClickHouse plus `Server-Timing` headers plus slog JSON cover this scale.

**Repo layout:**
```
api/openapi.yaml                 # contract source of truth
backend/                         # Go module nearbyfeed
  cmd/{api,worker,nfctl}/        # nfctl: seed, yt-probe, migrate-legacy, refresh-cell
  internal/{httpapi,auth,feed,items,social,geo,stream,cache,quota,telemetry}/
  internal/sources/{source.go,youtube/,fixtures/}
  internal/ingest/               # Temporal workflows + activities
  db/{migrations/,queries/}      # goose + sqlc
web/                             # kept, restructured (section 6)
packages/shared/                 # kept: pure TS domain logic
packages/api-client/             # generated: openapi-typescript + openapi-fetch
infra/{compose.yaml,clickhouse/,grafana/}   # moved from server/
perf/{k6/,lighthouse/,baseline.md}
.github/workflows/ci.yml
```

**Go stack:** stdlib `net/http` mux, `oapi-codegen` strict server, `pgx/v5` + `sqlc`, `goose`, `go-redis/v9`, `go.temporal.io/sdk`, `clickhouse-go/v2`, `uber/h3-go/v4` (cgo), `clerk-sdk-go/v2`.

**Local ports:** Postgres 54329, Redis 63799, ClickHouse 18123/19000, Grafana 3001, api 8080, web 5173. Temporal runs from the host CLI: `temporal server start-dev --db-filename .data/temporal.db` on 7233, UI on 8233. These avoid 5433 and 9344.

**Keep / port / delete:**
- **Keep:**
  - `packages/shared` geo math, poll math, validation, time formatting and `feed-presentation`, with their tests.
  - Web feature folders `create`, `details`, `moderation`, `feed` and `map`, plus the chunk-budget plugin, `view-route` and the Vitest suites.
  - The ClickHouse init script and the Grafana provisioning and dashboards.
- **Port:**
  - `web/src/lib/api.ts` to the generated client.
  - `useMapboxNearbyMap` to MapLibre (near-identical API).
  - `useNearbyLiveUpdates` to an SSE hook.
  - `Post`/`LiveUpdate` types to the unified `Item`.
  - NestJS business rules to Go, using the spec files as the behaviour checklist: reciprocal block exclusion, comment count decrement, poll lifecycle, report attribution, input trimming, telemetry sanitisation.
- **Delete:**
  - `server/` once M4 passes.
  - The `web/src/data/demo.ts` fallbacks (fake content shown as real).
  - The `Profile*Auth*` and `ProfileVerifyEmailCard` forms and `lib/session.ts`.
  - `x-status-url.ts`, `live-updates.ts` and the X-specific UI copy.
  - `client/` (the Expo app targets the dead API and stays in git history); confirm with the owner first.

## 2. Latency

**Budgets:**

| Metric | Target |
|---|---|
| First paint, cold (Lighthouse mobile, Slow 4G) | FCP ≤ 1.0 s, LCP ≤ 1.8 s |
| First paint, repeat visit | Cached feed visible ≤ 300 ms |
| Initial JS excluding the map chunk | ≤ 120 kB gzipped |
| `GET /v1/feed` server time at 200 rps, 1M items | p50 ≤ 20 ms, p95 ≤ 80 ms, p99 ≤ 200 ms |
| Feed, browser-perceived on local network | p95 ≤ 200 ms |
| Live update, DB commit to on screen | p95 ≤ 1 s |
| Cold area (no data yet) | Feed returns in budget with `freshness.state="warming"`; first external items arrive over SSE ≤ 6 s |

**Design that meets them:**
1. No external call ever runs in a request. Reads hit Postgres or Redis only. A cold cell enqueues a refresh and returns immediately.
2. An index-backed feed query (section 3) replaces the scan-and-filter loop. One SQL statement returns items, viewer reaction state and block filtering.
3. Anonymous feed pages are cached in Redis under `feed:{h3r8}:{radius}:{window}:{kinds}` with a 20 s TTL, and deleted on publish into that cell. Signed-in reads use the same cached page plus one small overlay query for the viewer's votes and blocks.
4. Client: the app shell is static. TanStack Query is persisted to IndexedDB so the last feed renders before the network. The map chunk loads lazily behind a static placeholder. The last known location is used immediately while geolocation resolves.
5. Realtime uses one SSE connection. New items are inserted into the query cache with no refetch.

**Measurement:**
- **Server:** middleware records each request (route, status, duration, db_ms, cache hit) into a buffered channel, flushed to ClickHouse `api_requests` every second or 1,000 rows. Every response carries `Server-Timing: db;dur=…, cache;dur=…, total;dur=…`.
- **Client:** the `web-vitals` library sends FCP, LCP, INP and CLS, plus two custom marks (`feed_first_item_ms`, `sse_event_lag_ms` computed as now minus the event's `committed_at`), to `POST /v1/telemetry` and on to ClickHouse `web_vitals`.
- **Load:** k6 scripts in `perf/k6`: `feed_read.js` (constant 200 rps, random points across three seeded metros), `mixed.js` (95% read, 5% write) and `sse.js` (2,000 connections).
- **Baseline (M0):**
  - Bring up the existing NestJS server against Postgres with 200k seeded posts (extend `prisma/seed.ts`).
  - Run `feed_read.js` against `GET /posts` at 20, 50 and 200 rps.
  - Capture `EXPLAIN (ANALYZE, BUFFERS)` of the feed query.
  - Measure `/live/nearby` against a stub TinyFish server that sleeps 8 s, cold and cached.
  - Run Lighthouse on the current web build.
  - Record it all in `perf/baseline.md`. The same scripts rerun at every milestone.

## 3. Data model

Fresh schema via goose; the legacy schema is migrated by script, not evolved.

```sql
CREATE EXTENSION postgis;

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_user_id text UNIQUE,            -- NULL = legacy, unclaimed
  legacy_email citext UNIQUE,           -- claim matching only; dropped later
  username text NOT NULL, image_url text,
  created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);

CREATE TABLE items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL,                 -- 'user','youtube',…
  external_id text,                     -- NULL for user posts
  kind text NOT NULL,                   -- post|video|live|event|article|alert
  author_user_id bigint REFERENCES users(id),
  author_name text, author_url text, author_avatar_url text,
  title text NOT NULL, body text, url text,
  media jsonb NOT NULL DEFAULT '[]',    -- [{type,url,w,h,embed_id}]
  geog geography(Point,4326) NOT NULL,
  geo_method text NOT NULL,             -- device|venue|source_tagged|source_place|query_area|channel_home|text_inferred
  geo_confidence real NOT NULL,         -- 0..1
  geo_radius_m int NOT NULL DEFAULT 0,  -- uncertainty
  place_name text,
  h3_r8 bigint NOT NULL, h3_r5 bigint NOT NULL,
  published_at timestamptz NOT NULL,
  fetched_at timestamptz, refresh_by timestamptz,   -- ToS refresh deadline
  status text NOT NULL DEFAULT 'active',            -- active|hidden|removed
  points int NOT NULL DEFAULT 0, comments_count int NOT NULL DEFAULT 0,
  source_meta jsonb NOT NULL DEFAULT '{}',          -- small, source-specific
  UNIQUE (source, external_id));

CREATE INDEX items_geog_gix   ON items USING gist (geog) WHERE status='active';
CREATE INDEX items_cell_time  ON items (h3_r8, published_at DESC, id DESC) WHERE status='active';
CREATE INDEX items_refresh    ON items (refresh_by) WHERE refresh_by IS NOT NULL;
CREATE INDEX items_author     ON items (author_user_id, published_at DESC);
```

Side tables, ported one-to-one from Prisma with `post_id` becoming `item_id`:
- `polls`, `poll_options`, `poll_votes`
- `comments` (index on `(item_id, parent_id, created_at)`)
- `reactions(item_id, user_id, value)` and `comment_reactions`
- `blocks`, `reports` (one table with `target_type`)
- `venues` (was `Location`)

New ingestion tables:
- `source_channels(source, external_id, home_geog, home_confidence, uploads_cursor, last_polled_at)`
- `cell_state(source, h3_r5, last_refreshed_at, last_result_count, next_page_token, consecutive_failures)`

Comments and votes attach to any item, so people can discuss a YouTube video locally.

**Feed query:** compute the res-8 cells covering the circle in Go (`GridDisk`) and run:
```sql
WHERE h3_r8 = ANY($cells) AND status='active' AND published_at > $since
  AND ST_DWithin(geog, $pt, $r)
  AND (published_at, id) < ($cur_ts, $cur_id)
ORDER BY published_at DESC, id DESC LIMIT $n
```
Map viewport queries use the GiST index with `geog && ST_MakeEnvelope(...)`. Acceptance: `EXPLAIN` at 1M rows shows index scans only for both.

**Radius change:** the existing 200/500/1000 m options suit user posts but return almost nothing external. The feed auto-widens through 1, 5 and 25 km until it has at least 20 items, and returns the `radius_used`.

**Legacy migration:** `nfctl migrate-legacy --from $OLD_DSN`:
- `User` becomes `users`, with `legacy_email` set, `clerk_user_id` NULL and the password dropped.
- `Post` becomes `items` with `source='user'`, `geo_method='device'`, confidence 1.
- Images, polls, comments, likes, blocks and reports map across with an ID map.
- `PendingUser` and `Provider` are discarded.
- The script is idempotent via a `legacy_id` column on a temporary mapping table.

**Clerk mapping:** on any authenticated request, upsert `users` by the JWT `sub`. On first sight of a `sub`, call the Clerk Backend API `user.Get` once; if a verified email equals a `legacy_email` on a row with a NULL `clerk_user_id`, claim that row. A Svix-verified webhook at `POST /v1/webhooks/clerk` handles `user.updated` and `user.deleted`.

## 4. Source ingestion

**Adapter interface** (`internal/sources/source.go`):
```go
type Source interface {
    Name() string
    Capabilities() Caps            // GeoSearch, ChannelPoll, Live; MinRefresh; MaxAge (ToS)
    Discover(ctx context.Context, q GeoQuery) (DiscoverResult, error) // refs + next cursor
    Hydrate(ctx context.Context, refs []Ref) ([]RawItem, error)       // batch detail
    Normalize(raw RawItem, q GeoQuery) (Item, GeoAttribution, error)  // pure, unit-tested
    Cost(op Op) QuotaCost          // bucket + units, checked before every call
}
type GeoQuery struct{ Cell h3.Cell; Center LatLng; RadiusM int; Since time.Time; Cursor string }
```
Each adapter takes an `http.RoundTripper`. A replay transport serves `fixtures/<source>/*.json` when `SOURCES_MODE=fixture`.

**Temporal workflows** (task queue `ingest`):
- `RefreshCellWorkflow(source, cell)`, with workflow ID `refresh:{source}:{cell}` and ID-conflict policy "use existing", which is the dedupe for concurrent demand. Activities run in order: `ReserveQuota`, `Discover`, `Hydrate`, `NormalizeAndUpsert`, `Publish` (XADD), `RecordRun` (ClickHouse).
- `DemandSchedulerWorkflow(source)`, a Temporal Schedule firing every minute. It reads the Redis ZSET `demand:{source}`, scores each cell as `viewers × minutes_since_refresh / expected_yield`, and starts refreshes for the top cells that the pacing budget allows.
- `PollChannelsWorkflow`, every 30 minutes: pulls uploads for `source_channels` ordered by home-cell demand.
- `RefreshItemsWorkflow`, daily: re-hydrates items with `refresh_by < now()+5d`, and marks missing or private ones `removed`.
- `PrewarmWorkflow`, hourly: queries ClickHouse for cells that were busy at this hour over the last 7 days and adds them to the demand set.

**Demand:** every feed read and SSE heartbeat does `ZADD demand:{source} <now> <h3_r5>`. Entries expire after 10 minutes. A cold cell with spare quota triggers an immediate signal rather than waiting for the tick.

**Dedupe:** `UNIQUE(source, external_id)` with `ON CONFLICT DO UPDATE`. Only inserts or meaningful changes emit stream events. Cross-source duplicates are left alone until a second video source exists.

**Quota:** Redis counters `quota:{source}:{bucket}:{period}` are reserved atomically by Lua script before each call. YouTube periods reset at midnight Pacific. On a 403 `quotaExceeded` the counter is pinned to the limit and the workflow sleeps until reset.

**Failure handling:**
- 5xx and network errors: exponential retry, 5 attempts.
- 4xx: non-retryable. `cell_state.consecutive_failures` increments and the cell's priority decays.
- An adapter with over 50% failures in 10 minutes opens a circuit breaker flag in Redis; the scheduler skips that source.
- The feed is unaffected in every case; `freshness` reports the true age.

### YouTube adapter

- **Discover:** `search.list?part=snippet&type=video&location={lat},{lng}&locationRadius={r}&order=date&publishedAfter={since}&maxResults=50&safeSearch=strict`. One call per res-5 cell (about 250 km², radius about 12 km). A second variant with `eventType=live` runs for cells with the highest demand.
- **Hydrate:** `videos.list?part=snippet,recordingDetails,liveStreamingDetails,status,statistics&id=…` in batches of 50. Drop videos where `status.embeddable=false`. Store `madeForKids`.
- **Pacing:** 90 of the 100 daily searches go to the scheduler, spread evenly at about one per 16 minutes, with 10 held for cold-cell requests. No cell refreshes more than once per 30 minutes. Pagination is used only when a page returns 50 and the cell has high demand.
- **Channel volume path:** every channel seen in geo results goes into `source_channels`. Its home is the median of its geotagged videos; confidence is the share of its videos that fall within 25 km. Uploads are polled with `playlistItems.list` (1 unit, from the 10k bucket). This supplies most of the volume without spending search quota.
- **Geo attribution:**

| Evidence | Method | Confidence | Radius |
|---|---|---|---|
| `recordingDetails.location` lat/lng present | `source_tagged` | 0.9 | 50 m |
| Only `locationDescription`, geocoded | `source_place` | 0.7 | 500 m |
| Matched a geo search, no coordinates returned | `query_area` | 0.4 | search radius |
| Channel upload, home confidence ≥ 0.6 | `channel_home` | 0.35 | 5 km |

  - Confidence ≥ 0.8 renders as a pin, 0.4 to 0.8 as a soft pin with a halo, and below 0.4 only in an "Around {city}" rail, never as a pin.
  - Geo is not inferred from titles in v1, because III.E.4.h (derived data) makes that a policy question.
- **Compliance built in:**
  - `refresh_by = fetched_at + 25d`.
  - Statistics are shown only from data under 30 days old.
  - Playback uses only the official IFrame player via `youtube-nocookie.com`, with no autoplay and no overlays.
  - Each card carries a YouTube logo and a "Watch on YouTube" link.
  - The footer links YouTube's ToS and Google's Privacy Policy, and the app has its own privacy policy page.
  - ClickHouse stores item IDs only, never YouTube metadata.
- **Probe:** `nfctl yt-probe --cities sg,nyc,london,tokyo` prints, per city, the result count, the share with coordinates and the median age. This decides whether res-5 cells and these confidence tiers hold. It costs 4 to 8 searches.

### Next sources, ranked

I did not re-verify these today; recheck terms when each adapter is built.

| # | Source | Access | Geo quality | Legal/ToS |
|---|---|---|---|---|
| 1 | Wikipedia / Wikimedia Commons | MediaWiki `geosearch`, no key | Exact | CC BY-SA; attribute. Evergreen place context that fills empty maps. |
| 2 | Official alerts and conditions (US NWS, USGS, Singapore data.gov.sg) | Open REST | Exact or polygon | Public or open-data licences. |
| 3 | Ticketmaster Discovery | Free key, lat/long + radius | Venue-exact | Attribution and link-back; limits on caching. |
| 4 | GDELT | Free files and API, 15-minute cadence | City-level | Open; link to publishers, show headlines only. |
| 5 | Bluesky | Jetstream firehose, no key | None native, so confidence is low | Open network; honour deletions. Rail only until attribution is good. |
| 6 | iNaturalist / Flickr | REST with geo queries | Exact | Per-item CC licences; Flickr's key is non-commercial. |
| 7 | Reddit city subreddits | OAuth API | Subreddit-level | Terms restrict commercial use; hobby use only. |
| — | X | Official API is paid | — | The current TinyFish scrape of x.com breaks X's terms; delete it. |

TinyFish can return later as an adapter for sites that permit automation (council notices, venue calendars), run only as a Temporal activity.

## 5. API and realtime

All routes are under `/v1`, JSON, with cursor pagination and errors as `application/problem+json`.

**Public (optional auth):**
- `GET /feed?lat&lng&radius_m&window&kinds&sources&cursor&limit` returns `{items, next_cursor, radius_used, freshness:{state:fresh|stale|warming, as_of, sources:[…]}}`
- `GET /map/items?bbox&zoom&window&kinds` returns items below a threshold count, and H3 cluster counts above it
- `GET /items/{id}`, `GET /items/{id}/comments?sort&cursor`, `GET /comments/{id}/replies`
- `GET /geo/reverse?lat&lng`, served by the worker-populated cache or Nominatim behind a Redis cache
- `GET /stream?cells=…` (SSE)
- `POST /telemetry`
- `GET /healthz`, `GET /readyz`

**Authenticated (Clerk):**
- `GET /me`, `PATCH /me`
- `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}`
- `PUT /items/{id}/vote`
- `POST /items/{id}/comments`, `DELETE /comments/{id}`, `PUT /comments/{id}/vote`
- `POST /polls/{id}/vote`
- `POST /reports`
- `PUT /blocks/{userId}`, `DELETE /blocks/{userId}`
- `GET /users/{id}/items`, `GET /users/{id}/comments`
- `POST /uploads/sign`

**Internal:** `POST /webhooks/clerk`, and in dev only `POST /dev/token`.

**Contract sharing:** `api/openapi.yaml` (OpenAPI 3.1) is hand-written and is the only source of truth. `make gen` runs `oapi-codegen` for Go strict server types and `openapi-typescript` for `packages/api-client`, which the web consumes through `openapi-fetch`. CI fails if the generated output differs. Enumerations that live in `packages/shared` today (distances, time windows, report reasons) move into the spec and are re-exported from there.

**SSE, not WebSocket.** The traffic is one-way server to client. SSE gives automatic reconnect with `Last-Event-ID`, passes through proxies and HTTP/2, and needs no protocol code. Writes stay on REST.

- The bus is a single Redis Stream, `feed:events`, capped at about 100k entries.
- Each API instance runs one `XREAD` loop and fans events out in memory to connections indexed by res-5 cell.
- Event types: `item.new`, `item.update`, `item.remove`, `cell.freshness`. The Redis stream ID is the SSE `id`, so a reconnect replays from `Last-Event-ID`.
- The client opens one stream for the viewport's cells (at most 30) and reconnects with a 500 ms debounce when the viewport changes.
- A heartbeat comment goes out every 20 s.
- The stream is anonymous because the content is public. Per-user events can later use a fetch-based SSE client with a Bearer token.

## 6. UI

I read the web code but did not run it, so treat the visual direction as a brief rather than a critique of what exists.

**Experience:** one screen, map-first, called "what's happening around here, now". The current five separate views (feed, map, create, details, profile) collapse into a map canvas with a feed sheet over it.

- **Desktop (≥ 1024 px):** a full-bleed map with a 420 px feed column on the left. Selecting a card flies the map to it, and selecting a pin scrolls the feed to the card. Details open as a panel over the feed column at `/i/{id}`; the map never unmounts.
- **Mobile:** full-screen map with a bottom sheet at three snap points (peek 96 px, half, full). Create is a floating button.
- **Top bar:** place name, a time-window segmented control (1h, 24h, 7d), source filter chips (People, YouTube, later sources), and the Clerk `<UserButton>`.
- **Cards:** one `ItemCard` with per-kind variants.
  - User post: text, images, poll (keep the existing `PollPreview` and `FeedCardActions`).
  - Video: a 16:9 thumbnail with a source badge and channel name; a click swaps the thumbnail for the IFrame player in place.
  - Live: the same, with a pulsing red "LIVE" tag.
  - Every card shows distance, relative time and a geo-confidence glyph: solid pin, haloed pin, or "area".
- **Map:** MapLibre GL with OpenFreeMap vector tiles, so no key is needed (verify its availability and terms at M1; the fallback is self-hosted Protomaps PMTiles).
  - A custom dark style. Colour is reserved for content: one accent per source, and red only for live.
  - Clusters show source-split rings.
  - Low-confidence items draw a translucent uncertainty circle.
  - New items from SSE drop in with a 300 ms scale-and-fade and a single ripple.
  - When the feed is scrolled, new arrivals collect in a "3 new" pill rather than shifting content.
  - Fun tech with a purpose: at city zoom, an H3 hex heat layer (deck.gl `H3HexagonLayer`, lazy-loaded) shows activity density from `/map/items` clusters.
- **Design direction:** a dark, cartographic, calm chrome with a dense information layout. Keep the tokens in `foundation.css`. Write the new shell in new CSS files and delete the `premium-*` and `live-social.css` files as their views are replaced. Use system font stacks so there is no font fetch. Motion stays under 300 ms and respects `prefers-reduced-motion`.

**What makes it feel instant:**
- The persisted query cache paints the last feed and the last map camera before any network call.
- The static shell plus a skeleton list renders in the first frame.
- Geolocation is requested only after first paint; meanwhile the app uses the last known or default location.
- Hovering or focusing a card prefetches its details.
- Votes, comments and posts are optimistic, with rollback on error.
- Thumbnails use `loading="lazy"`, fixed aspect boxes and `srcset`. The YouTube IFrame loads only on click.
- Moving the map keeps the previous data visible (`placeholderData`) while new data loads.

**States:**
- **Loading:** six skeleton cards and a muted map; never a spinner on its own.
- **Warming** (cold area): real user posts if there are any, plus a thin progress strip reading "Looking for videos around {place}…". Items stream in over SSE. After 10 s with nothing, it switches to the empty state.
- **Empty:** "Nothing here in the last 24h" with two actions, "Widen to 7 days" and "Post the first update". No demo data, ever.
- **Location denied or unavailable:** the app stays usable. A banner says "Showing {city}. Search a place or enable location" and offers a place search box. The choice is remembered.
- **Offline:** cached content stays, with an "Offline · showing saved feed from 14:02" strip. Compose is disabled with an explanation. On reconnect the stream resumes via `Last-Event-ID`.
- **Error:** an inline retry on the failed region only. A source that is down shows as a greyed chip with a tooltip.
- **Quota exhausted:** the YouTube chip reads "Updated 3h ago"; no error is shown.

## 7. Hardening

**Security:**
- **Clerk verification:** `clerkhttp.WithHeaderAuthorization(AuthorizedPartyMatches(allowedOrigins...))` on all routes; write routes return 401 without claims. Never trust a client-supplied user ID (the legacy `userId` query parameter is gone). Webhooks are verified with Svix signatures.
- **Dev mode:** the `auth.Verifier` interface has two implementations. `DevVerifier` signs and verifies tokens with a local key via `/dev/token`. It is compiled in only when `APP_ENV=dev`, and the server refuses to start with it otherwise.
- **Location privacy:**
  - Reader coordinates are never persisted. Logs and ClickHouse get only the res-7 cell (about 5 km²).
  - User posts default to "approximate": snapped to the res-10 cell centre (about 65 m) before storage. Exact location is stored only when the author tags a venue.
  - Coordinates are stripped from telemetry.
  - Cached feed keys use cells, not raw coordinates.
- **Rate limits** (Redis sliding window, per IP and per user): reads 120/min, writes 20/min, posts 5 per 10 min, reports 10/hour, telemetry 60/min, SSE 5 concurrent connections per IP. A 429 carries `Retry-After`.
- **Input:** body size caps, strict OpenAPI validation, and text sanitised on output. Image uploads use presigned PUT with content-type and size limits.
- **CORS and headers:** an explicit origin allowlist, and a CSP that allows only `youtube-nocookie.com` frames and the tile host.
- **Moderation:**
  - Port the profanity filter, reports and blocks.
  - An item with 3 or more distinct reports is auto-hidden pending review, and that applies to external items too.
  - External sources use `safeSearch=strict` and a per-source channel denylist table.
  - `nfctl moderate list|hide|restore` stands in for an admin UI.

**Testing:**
- **Go unit:** `Normalize`, the geo confidence table, quota pacing, cursor encoding.
- **Go integration:** `testcontainers-go` with PostGIS and Redis for the feed queries, including an `EXPLAIN` assertion that no sequential scan occurs.
- **Adapter contract tests:** replayed fixtures per source, including quota-exceeded, empty and malformed responses.
- **Temporal:** `testsuite` for the workflows, covering dedupe, retry and quota sleep.
- **API:** every OpenAPI operation is exercised through `httptest`, with responses validated against the spec.
- **Web:** keep the existing Vitest suites, and add MSW driven by the generated types.
- **E2E:** Playwright against the compose stack in fixture mode, covering every state in section 6 with geolocation mocked as granted and as denied. Claude in Chrome does a visual pass at each milestone using a written checklist with screenshots.

**Load:** the k6 scripts from section 2 run against 1M seeded items across 3 metros. Pass means the section 2 budgets are met, the error rate is under 0.1%, and 2,000 SSE clients receive an event with p95 under 1 s.

**Observability:** ClickHouse tables `api_requests`, `web_vitals`, `ingest_runs` (source, cell, calls, items new and updated, quota used, duration, error) and `demand_cells`, alongside the existing `nearbyfeed_events`. Grafana gets three dashboards: Latency, Ingestion and quota, and Demand. Logs are slog JSON with a request ID that is propagated into Temporal workflow memos.

**CI** (`.github/workflows/ci.yml` at the repo root):
- `go vet`, `golangci-lint`, `go test -race` (Docker is available for testcontainers).
- `make gen` followed by `git diff --exit-code`.
- Web type-check, Vitest, and the build with its chunk budget.
- Playwright in fixture mode.
- A 30-second k6 smoke run with p95 thresholds.

## 8. Milestones

Each milestone ends with `make up && make demo` working, and with the section 2 numbers appended to `perf/baseline.md`.

**M0 — Baseline and scaffold** (no keys needed)
- Create `infra/compose.yaml` on the ports above, the Go module skeleton, `make` targets and root CI.
- Run the baseline from section 2 against the NestJS server.
- ✅ `perf/baseline.md` holds feed p50/p95 at three load levels, the `EXPLAIN` showing a sequential scan, the stubbed live cold-path time and the Lighthouse scores. CI is green.

**M1 — Real YouTube on the map, measured** (🔑 `YOUTUBE_API_KEY`)
- Scope: the `items` schema, the YouTube adapter (Discover and Hydrate), a `RefreshCellWorkflow` started by `nfctl refresh-cell --lat --lng`, the Redis quota counter, `GET /v1/feed` and `/v1/map/items`, and request telemetry into ClickHouse.
- Web: a new MapLibre map route rendering items with confidence styling, a card list, and the click-to-play IFrame.
- Not in scope: auth, SSE, the scheduler, the cache.
- Without the key: build everything against fixtures with `SOURCES_MODE=fixture`. These fixtures are synthetic, written from the documented response shapes; replace them with recorded responses on the first keyed run.
- ✅ With the key:
  - `nfctl yt-probe` output is committed.
  - Refreshing the owner's city puts at least one real video on the map, and it plays.
  - The Redis quota counter matches the number of calls made.
  - k6 `feed_read` at 200 rps on 1M seeded rows plus the real items meets p95 ≤ 80 ms.
  - The Grafana Latency dashboard shows the run.
  - A Claude in Chrome screenshot is attached.
- 🧭 Owner decision after the probe: if under about 20% of results carry coordinates, accept "soft pins" as the default look for YouTube.

**M2 — Demand scheduling and realtime**
- Scope: the demand ZSET, `DemandSchedulerWorkflow`, cold-cell signalling, `freshness` in responses, the Redis Stream, SSE and the web hook for it, the Redis feed cache, channel registry polling, `RefreshItemsWorkflow`, and the circuit breaker.
- ✅ Opening a never-seen city shows "warming", then items appear with no reload in ≤ 6 s (real key) or ≤ 2 s (fixtures).
- ✅ Two tabs on the same area start exactly one workflow, checked in the Temporal UI.
- ✅ With the quota forced to zero, the feed still serves with a stale freshness state.
- ✅ `sse.js` passes.
- ✅ Killing the worker mid-refresh and restarting it completes the refresh without duplicates.

**M3 — The product UI** (public content only)
- Scope: the map-and-sheet shell, the top bar and filters, every state from section 6, the persisted cache, optimistic scaffolding, the details panel, the hex heat layer, the legal footer and the privacy page.
- Delete `data/demo.ts` and the superseded CSS.
- ✅ Lighthouse budgets met. Playwright covers every state. Claude in Chrome completes the checklist at 390 px and 1440 px. A repeat visit paints the cached feed in ≤ 300 ms.

**M4 — Clerk and the social layer** (🔑 Clerk publishable and secret keys, webhook secret)
- Scope: Clerk in the web app, verifier middleware, user upsert and legacy claim, posts, polls, comments, votes, blocks, reports, image upload via MinIO, and `nfctl migrate-legacy`.
- Without keys: `DevVerifier` plus a `VITE_AUTH_MODE=dev` provider exposing the same `useAuth` and `getToken` surface.
- ✅ Sign in, post with a poll, and see it in a second browser over SSE in ≤ 1 s.
- ✅ The ported behaviour checklist from the Nest specs passes as Go tests.
- ✅ Tokens with a wrong `azp`, an expired `exp` or a tampered signature are rejected.
- ✅ The migration is idempotent on a seeded legacy database.
- 🧭 Owner: is there any production data worth migrating? If not, the migrator stays a tested tool that is never run.

**M5 — Hardening**
- Scope: rate limits, the moderation flow, CSP, privacy snapping, the full load suite, the remaining dashboards, and the pre-warm workflow.
- ✅ The full section 7 load criteria pass. The abuse tests return 429s. A fresh clone reaches a running demo with one command.

**M6 — Sources two and three**
- Scope: Wikipedia geosearch, then official alerts for the owner's region. Each is an adapter plus fixtures plus one card variant.
- ✅ Neither needs any change to the workflows or the feed API. That is the test of the adapter interface.
- 🔑 File the YouTube quota extension form now; it requires the compliance items from section 4 to be live.

**M7 — Remove legacy**
- Delete `server/` and, with the owner's confirmation, `client/`. Update the README.
- ✅ CI is green with no Node backend.

## 9. Risks and open questions

1. **YouTube geo yield is unknown until probed.** The docs mark `recordingDetails.location` deprecated while still calling it searchable. If coordinates are no longer returned, every YouTube item becomes `query_area` at about 12 km precision. Mitigation: shrink the search radius to tighten attribution, at the cost of quota, and lean on the channel registry.
2. **100 searches/day** caps coverage at about one metro. A quota extension needs a compliance audit and is not guaranteed. Launch scoped to the owner's city.
3. **YouTube policy interpretation.** Channel-home attribution might be read as "derived data", and mixing YouTube items with other sources in one feed is common but not explicitly blessed. Keep the YouTube filter chip and attribution prominent, and be ready to drop `channel_home`.
4. **The 30-day rule** forces continual refresh, costing about 1 unit per 50 items per 25 days. That is trivial now, but it bounds the retained corpus.
5. **OpenFreeMap** availability and terms are not verified here. The fallback is PMTiles served from object storage.
6. **cgo for H3** complicates cross-compilation and slim images. If it hurts, use the `h3-pg` Postgres extension or switch to S2 (pure Go) and lose the hex layer.
7. **Feed ranking** is purely chronological. With mixed sources, video volume may drown user posts. A likely follow-up is per-source interleaving caps, which needs owner taste.
8. **Open questions for the owner:**
   - Which launch city?
   - Is there legacy production data?
   - Should people be able to comment on external items (the plan assumes yes)?
   - Is deleting `client/` now acceptable?
   - Where will this be hosted? That affects SSE proxy timeouts and whether Temporal Cloud is worth using.

**Sources:**
- [YouTube search.list reference](https://developers.google.com/youtube/v3/docs/search/list)
- [YouTube quota costs](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube API revision history](https://developers.google.com/youtube/v3/revision_history)
- [YouTube videos resource](https://developers.google.com/youtube/v3/docs/videos)
- [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- [Clerk Go SDK `http` package](https://pkg.go.dev/github.com/clerk/clerk-sdk-go/v2/http)
- [Clerk manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification)
- [Clerk Go session verification](https://clerk.com/docs/references/go/verifying-sessions)
