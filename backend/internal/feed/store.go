// Package feed reads and writes items.
package feed

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nearbyfeed/internal/geo"
	"nearbyfeed/internal/sources"
)

// widenSteps are the radii tried, in order, until a page has enough items.
var widenSteps = []int{1000, 5000, 25000}

const minItemsBeforeWiden = 20

// ErrInvalidCursor means a client sent a cursor this server did not issue.
var ErrInvalidCursor = errors.New("invalid cursor")

// Item is one feed entry as returned to clients.
type Item struct {
	ID            int64           `json:"id"`
	Source        string          `json:"source"`
	Kind          string          `json:"kind"`
	Title         string          `json:"title"`
	Body          *string         `json:"body"`
	URL           *string         `json:"url"`
	AuthorName    *string         `json:"author_name"`
	AuthorURL     *string         `json:"author_url"`
	Media         json.RawMessage `json:"media"`
	Lat           float64         `json:"lat"`
	Lng           float64         `json:"lng"`
	GeoMethod     string          `json:"geo_method"`
	GeoConfidence float32         `json:"geo_confidence"`
	GeoRadiusM    int             `json:"geo_radius_m"`
	PlaceName     *string         `json:"place_name"`
	PublishedAt   time.Time       `json:"published_at"`
	Points        int             `json:"points"`
	CommentsCount int             `json:"comments_count"`
	DistanceM     float64         `json:"distance_m"`
}

// Query selects one page of the feed.
type Query struct {
	Lat     float64
	Lng     float64
	RadiusM int // 0 widens automatically from the smallest step.
	Since   time.Time
	Limit   int
	Cursor  string
}

// Page is one page of results.
type Page struct {
	Items      []Item `json:"items"`
	NextCursor string `json:"next_cursor,omitempty"`
	RadiusUsed int    `json:"radius_used"`
}

// Store runs item queries against Postgres.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore returns a store using pool.
func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

type cursor struct {
	publishedAt time.Time
	id          int64
	radiusM     int
}

func (c cursor) encode() string {
	raw := fmt.Sprintf("%d:%d:%d", c.publishedAt.UnixMicro(), c.id, c.radiusM)
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

func decodeCursor(value string) (cursor, error) {
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return cursor{}, ErrInvalidCursor
	}
	parts := strings.Split(string(raw), ":")
	if len(parts) != 3 {
		return cursor{}, ErrInvalidCursor
	}
	micros, errTime := strconv.ParseInt(parts[0], 10, 64)
	id, errID := strconv.ParseInt(parts[1], 10, 64)
	radius, errRadius := strconv.Atoi(parts[2])
	if errTime != nil || errID != nil || errRadius != nil || radius <= 0 {
		return cursor{}, ErrInvalidCursor
	}
	return cursor{publishedAt: time.UnixMicro(micros), id: id, radiusM: radius}, nil
}

// Feed returns a page, newest first. Later pages keep the first page's radius
// so widening cannot repeat or skip items.
func (s *Store) Feed(ctx context.Context, q Query) (Page, error) {
	if q.Cursor != "" {
		after, err := decodeCursor(q.Cursor)
		if err != nil {
			return Page{}, err
		}
		return s.page(ctx, q, after.radiusM, &after)
	}

	if q.RadiusM > 0 {
		return s.page(ctx, q, q.RadiusM, nil)
	}

	var page Page
	var err error
	for _, radius := range widenSteps {
		page, err = s.page(ctx, q, radius, nil)
		if err != nil {
			return Page{}, err
		}
		if len(page.Items) >= min(minItemsBeforeWiden, q.Limit) {
			break
		}
	}
	return page, nil
}

// timeSteps are how far back a read looks, tried in order. A combined location
// and time index makes each step cost roughly the rows inside that window, so
// dense areas stop early and sparse areas have little to read at any step.
// Sorting every match instead costs 200k+ rows for a dense 25 km read.
var timeSteps = []time.Duration{time.Hour, 8 * time.Hour, 72 * time.Hour, 14 * 24 * time.Hour}

const feedSQL = `
SELECT id, source, kind, title, body, url, author_name, author_url, media,
       ST_Y(geog::geometry), ST_X(geog::geometry),
       geo_method, geo_confidence, geo_radius_m, place_name,
       published_at, points, comments_count,
       ST_Distance(geog, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
FROM items
WHERE status = 'active'
  AND published_at > $3
  AND ST_DWithin(geog, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $4)
  AND ($5::timestamptz IS NULL OR (published_at, id) < ($5, $6))
ORDER BY published_at DESC, id DESC
LIMIT $7`

// page returns the newest items in the circle. It searches a growing time
// window and stops once a window holds a full page. That stays exact: anything
// outside the window is older than everything inside it.
func (s *Store) page(ctx context.Context, q Query, radiusM int, after *cursor) (Page, error) {
	var afterTime *time.Time
	var afterID int64
	anchor := time.Now()
	if after != nil {
		afterTime, afterID = &after.publishedAt, after.id
		anchor = after.publishedAt
	}

	// One extra row reveals whether another page exists.
	want := q.Limit + 1

	var items []Item
	for _, since := range windowStarts(anchor, q.Since) {
		rows, err := s.pool.Query(ctx, feedSQL, q.Lng, q.Lat, since, radiusM, afterTime, afterID, want)
		if err != nil {
			return Page{}, fmt.Errorf("feed query: %w", err)
		}
		items, err = pgx.CollectRows(rows, scanItem)
		if err != nil {
			return Page{}, fmt.Errorf("feed scan: %w", err)
		}
		if len(items) >= want {
			break
		}
	}

	page := Page{Items: items, RadiusUsed: radiusM}
	if len(items) > q.Limit {
		page.Items = items[:q.Limit]
		last := page.Items[q.Limit-1]
		page.NextCursor = cursor{publishedAt: last.PublishedAt, id: last.ID, radiusM: radiusM}.encode()
	}
	return page, nil
}

// windowStarts lists the window starts to try, ending exactly at oldest so the
// final search always covers the caller's full range.
func windowStarts(anchor, oldest time.Time) []time.Time {
	starts := make([]time.Time, 0, len(timeSteps)+1)
	for _, step := range timeSteps {
		start := anchor.Add(-step)
		if !start.After(oldest) {
			break
		}
		starts = append(starts, start)
	}
	return append(starts, oldest)
}

func scanItem(row pgx.CollectableRow) (Item, error) {
	var item Item
	err := row.Scan(
		&item.ID, &item.Source, &item.Kind, &item.Title, &item.Body, &item.URL,
		&item.AuthorName, &item.AuthorURL, &item.Media, &item.Lat, &item.Lng,
		&item.GeoMethod, &item.GeoConfidence, &item.GeoRadiusM, &item.PlaceName,
		&item.PublishedAt, &item.Points, &item.CommentsCount, &item.DistanceM,
	)
	return item, err
}

const upsertSQL = `
INSERT INTO items (
  source, external_id, kind, author_name, author_url, title, body, url, media,
  geog, geo_method, geo_confidence, geo_radius_m, place_name, h3_r8, h3_r5,
  published_at, fetched_at, refresh_by, source_meta
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9,
  ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography, $12, $13, $14, $15, $16, $17,
  $18, $19, $20, $21
)
ON CONFLICT (source, external_id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  kind = EXCLUDED.kind,
  media = EXCLUDED.media,
  fetched_at = EXCLUDED.fetched_at,
  refresh_by = EXCLUDED.refresh_by,
  source_meta = EXCLUDED.source_meta
RETURNING (xmax = 0)`

// Upsert stores items and reports how many were new. An existing item keeps
// its location: re-discovery from a wider search must not degrade it.
func (s *Store) Upsert(ctx context.Context, items []sources.Item) (inserted, updated int, err error) {
	for _, item := range items {
		r8, r5, err := geo.Cells(item.Geo.Point.Lat, item.Geo.Point.Lng)
		if err != nil {
			return inserted, updated, err
		}
		media, err := json.Marshal(item.Media)
		if err != nil {
			return inserted, updated, err
		}
		meta, err := json.Marshal(item.SourceMeta)
		if err != nil {
			return inserted, updated, err
		}

		var isNew bool
		err = s.pool.QueryRow(ctx, upsertSQL,
			item.Source, item.ExternalID, item.Kind, item.AuthorName, item.AuthorURL,
			item.Title, item.Body, item.URL, media,
			item.Geo.Point.Lng, item.Geo.Point.Lat, item.Geo.Method, item.Geo.Confidence,
			item.Geo.RadiusM, item.Geo.PlaceName, r8, r5,
			item.PublishedAt, item.FetchedAt, item.RefreshBy, meta,
		).Scan(&isNew)
		if err != nil {
			return inserted, updated, fmt.Errorf("upsert %s/%s: %w", item.Source, item.ExternalID, err)
		}
		if isNew {
			inserted++
		} else {
			updated++
		}
	}
	return inserted, updated, nil
}
