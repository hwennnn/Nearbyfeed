# Performance baseline

Measured 2026-11-05 on the legacy NestJS server (`server/`, branch `rebuild/go-platform`).

## Setup

- One Apple Silicon Mac, running everything: Node API (single process), Postgres 17 in Docker, Redis, and k6 in Docker.
- Numbers compare runs on this machine. They are not production estimates.
- Anonymous reads of `GET /posts`, `distance=1000`, `take=15`. Signed-in reads add a blocked-users query, which this does not cover.
- Seed data (`perf/seed-legacy.sql`) has posts only, with no likes, polls or comments. The table fits in memory (172 MB at 1M rows), so reads are warm-cache best case.
- 30 s per run, `perf/k6/feed_read.js`, constant arrival rate.

## Feed read, server response time

| Rows | Area | Rate | p50 | p95 | p99 | Failed | Dropped |
|---|---|---|---|---|---|---|---|
| 200k | Dense | 20 rps | 14.4 ms | 18.4 ms | 22.5 ms | 0 | 0 |
| 200k | Dense | 50 rps | 14.3 ms | 18.2 ms | 24.8 ms | 0 | 0 |
| 200k | Dense | 200 rps | 17.1 ms | 35.7 ms | 53.3 ms | 0 | 0 |
| 200k | Sparse | 20 rps | 12.0 ms | 14.1 ms | 15.6 ms | 0 | 0 |
| 200k | Sparse | 50 rps | 11.7 ms | 13.6 ms | 16.8 ms | 0 | 0 |
| 200k | Sparse | 200 rps | 13.9 ms | 30.5 ms | 46.0 ms | 0 | 0 |
| 1M | Dense | 20 rps | 35.1 ms | 39.0 ms | 42.3 ms | 0 | 0 |
| 1M | Dense | 50 rps | 34.8 ms | 45.6 ms | 56.9 ms | 0 | 0 |
| 1M | Dense | **200 rps** | **5.84 s** | **9.79 s** | **10.03 s** | 0 | **1,634** |

The 1M, 200 rps run sustained only 110.8 rps against the 200 rps offered.

## What this shows

- **The feed scan is a capacity limit, not a per-request cost.** Below saturation the legacy feed is fast, and it beats the rebuild's 80 ms p95 target. At 1M rows it saturates somewhere between 50 and 200 rps, and latency jumps from tens of milliseconds to seconds.
- `EXPLAIN (ANALYZE, BUFFERS)` shows a parallel sequential scan for both dense and sparse areas: about 10 ms and 3,850 buffers at 200k rows. Dense reads get no early exit, because the query sorts all matches.
- Scan time grows with the whole table, not with the local area, so the ceiling keeps dropping as data grows.

## Not measured yet

- **Live path:** `/live/nearby` runs a TinyFish browser job in the request, with a 20 s timeout. The URL is hard-coded, so the planned stub needs a code change first. The 20 s is the code's limit, not a measured latency.
- **Web:** Lighthouse scores for the current build.
- **1M sparse:** expected to match dense, because the plan is the same scan. Not run.
- **Exact saturation point** between 50 and 200 rps at 1M rows.

## Rebuilt feed (`GET /v1/feed`, Go)

Same machine, metro layout and k6 script, 1M items, `window=30d`, 20 s per run (30 s for the legacy runs).

| Radius | Area | Rate | p50 | p95 | p99 | Failed | Dropped |
|---|---|---|---|---|---|---|---|
| 1 km | Dense | 200 rps | 4.1 ms | 5.1 ms | 5.7 ms | 0 | 0 |
| 1 km | Dense | 1,000 rps | 5.1 ms | 19.1 ms | 93.8 ms | 0 | 0 |
| 5 km | Dense | 200 rps | 3.9 ms | 4.9 ms | 5.7 ms | 0 | 0 |
| 5 km | Dense | 1,000 rps | 4.4 ms | 7.3 ms | 12.1 ms | 0 | 0 |
| 25 km | Dense | 200 rps | 3.9 ms | 5.3 ms | 6.9 ms | 0 | 0 |
| 25 km | Dense | 1,000 rps | 3.8 ms | 6.8 ms | 10.4 ms | 0 | 0 |
| 25 km | Sparse | 200 rps | 6.5 ms | 9.1 ms | 11.1 ms | 0 | 0 |

Against legacy at 1M rows and 200 rps, p95 went from 9.79 s to 5.1 ms at the same 1 km radius.

**Correctness:** 48 random reads across six radii, three pages each, matched a brute-force `ORDER BY` exactly (`published_at`, `id`).

### Limits of this comparison

- **The two responses are not equal.** Legacy also loads author, poll and like data. The Go feed returns items only, and that work returns in M4, so re-measure then. Go against Node and index against scan are not separated here either.
- **Seed timestamps are uniform.** Each step of the time window finds rows at a steady rate. The bad case is an area with many old items and nothing recent, which reads every row in the window. It is not measured yet.
- **Reads only.** No concurrent writes, which matters because the GiST index is more expensive to update.
- **Warm cache.** The working set fits in memory.

## Designs that failed

Kept so nobody retries them. All figures are 1M rows.

| Design | Result |
|---|---|
| Plan's query: `h3_r8 = ANY(cells)` and sort | Fine at 1 km and 5 km. At 25 km it matched 212,453 rows per read: 61.5% failed at 50 rps. |
| Newest rows per res-5 cell, merged | 5 km p95 756 ms, 25 km capped near 70 rps. Cells clipping the circle's edge reject thousands of rows. |
| Same, with bitmap scans off | 382 ms to 64 ms by hand, but no help under load (see next row). |
| Prepared statements left on default | After five runs the generic plan probes the geography index per cell: 3,346 ms against 59 ms. The API still forces custom plans. |

**What worked:** one GiST index on `(geog, published_at)`, searched over a growing time window. Anything outside a window is older than everything inside it, so stopping at the first full window is exact.
