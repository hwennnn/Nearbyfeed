// Package sources defines the contract every external content adapter meets.
package sources

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// Geo attribution methods, ordered from most to least trustworthy.
const (
	GeoSourceTagged = "source_tagged"
	GeoSourcePlace  = "source_place"
	GeoQueryArea    = "query_area"
	GeoChannelHome  = "channel_home"
)

// LatLng is a WGS84 coordinate.
type LatLng struct {
	Lat float64
	Lng float64
}

// GeoQuery asks a source for content around a point.
type GeoQuery struct {
	Center  LatLng
	RadiusM int
	Since   time.Time
	Cursor  string
}

// Ref identifies an item discovered at a source, before hydration.
type Ref struct {
	ExternalID string
}

// DiscoverResult is one page of discovered references.
type DiscoverResult struct {
	Refs       []Ref
	NextCursor string
}

// Attribution records where an item is and how much we trust that.
type Attribution struct {
	Point      LatLng
	Method     string
	Confidence float32
	RadiusM    int
	PlaceName  string
}

// Media is one attachment on an item.
type Media struct {
	Type    string `json:"type"`
	URL     string `json:"url"`
	Width   int    `json:"w,omitempty"`
	Height  int    `json:"h,omitempty"`
	EmbedID string `json:"embed_id,omitempty"`
}

// Item is source content normalized for storage.
type Item struct {
	Source      string
	ExternalID  string
	Kind        string
	Title       string
	Body        string
	URL         string
	AuthorName  string
	AuthorURL   string
	Media       []Media
	Geo         Attribution
	PublishedAt time.Time
	FetchedAt   time.Time
	RefreshBy   time.Time
	SourceMeta  map[string]any
}

// Source is implemented by every content adapter.
type Source interface {
	Name() string
	Discover(ctx context.Context, q GeoQuery) (DiscoverResult, error)
	Hydrate(ctx context.Context, refs []Ref, q GeoQuery) ([]Item, error)
}

// ErrQuotaExceeded means the source refused a call because quota ran out.
// Callers must not retry until the quota period resets.
var ErrQuotaExceeded = errors.New("source quota exceeded")

// PermanentError marks a failure that retrying cannot fix, such as a 4xx.
type PermanentError struct {
	Status int
	Reason string
}

func (e *PermanentError) Error() string {
	return fmt.Sprintf("source rejected request: status %d: %s", e.Status, e.Reason)
}
