// Package httpapi exposes the public HTTP API.
package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"nearbyfeed/internal/feed"
)

const (
	defaultLimit  = 20
	maxLimit      = 50
	maxRadiusM    = 25000
	defaultWindow = 7 * 24 * time.Hour
)

var windows = map[string]time.Duration{
	"1h":  time.Hour,
	"24h": 24 * time.Hour,
	"7d":  defaultWindow,
	"30d": 30 * 24 * time.Hour,
}

// FeedHandler serves GET /v1/feed.
type FeedHandler struct {
	Store  *feed.Store
	Logger *slog.Logger
}

func (h FeedHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	query, err := parseFeedQuery(r)
	if err != nil {
		writeProblem(w, http.StatusBadRequest, err.Error())
		return
	}

	started := time.Now()
	page, err := h.Store.Feed(r.Context(), query)
	dbTime := time.Since(started)

	if errors.Is(err, feed.ErrInvalidCursor) {
		writeProblem(w, http.StatusBadRequest, "invalid cursor")
		return
	}
	if err != nil {
		h.Logger.Error("feed read failed", "error", err)
		writeProblem(w, http.StatusInternalServerError, "could not load feed")
		return
	}

	w.Header().Set("Server-Timing", fmt.Sprintf("db;dur=%.2f", float64(dbTime.Microseconds())/1000))
	writeJSON(w, http.StatusOK, page)
}

func parseFeedQuery(r *http.Request) (feed.Query, error) {
	values := r.URL.Query()

	lat, err := parseFloatInRange(values.Get("lat"), "lat", -90, 90)
	if err != nil {
		return feed.Query{}, err
	}
	lng, err := parseFloatInRange(values.Get("lng"), "lng", -180, 180)
	if err != nil {
		return feed.Query{}, err
	}

	query := feed.Query{Lat: lat, Lng: lng, Limit: defaultLimit, Cursor: values.Get("cursor")}

	if raw := values.Get("radius_m"); raw != "" {
		radius, err := strconv.Atoi(raw)
		if err != nil || radius < 1 || radius > maxRadiusM {
			return feed.Query{}, fmt.Errorf("radius_m must be between 1 and %d", maxRadiusM)
		}
		query.RadiusM = radius
	}

	if raw := values.Get("limit"); raw != "" {
		limit, err := strconv.Atoi(raw)
		if err != nil || limit < 1 || limit > maxLimit {
			return feed.Query{}, fmt.Errorf("limit must be between 1 and %d", maxLimit)
		}
		query.Limit = limit
	}

	window := defaultWindow
	if raw := values.Get("window"); raw != "" {
		parsed, ok := windows[raw]
		if !ok {
			return feed.Query{}, errors.New("window must be one of 1h, 24h, 7d, 30d")
		}
		window = parsed
	}
	query.Since = time.Now().Add(-window)

	return query, nil
}

func parseFloatInRange(raw, name string, low, high float64) (float64, error) {
	value, err := strconv.ParseFloat(raw, 64)
	// The negated comparison also rejects NaN, which ParseFloat accepts.
	if err != nil || !(value >= low && value <= high) {
		return 0, fmt.Errorf("%s must be a number between %g and %g", name, low, high)
	}
	return value, nil
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeProblem(w http.ResponseWriter, status int, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"title":  http.StatusText(status),
		"status": status,
		"detail": detail,
	})
}
