// Package geo maps coordinates onto the H3 cells used for indexing.
package geo

import (
	"fmt"

	"github.com/uber/h3-go/v4"
)

const (
	// FeedResolution groups items for the map's hex layer.
	FeedResolution = 8
	// RefreshResolution groups items into ingestion cells.
	RefreshResolution = 5
)

// Cells returns an item's res-8 and res-5 cell indexes.
func Cells(lat, lng float64) (r8, r5 int64, err error) {
	cell, err := h3.LatLngToCell(h3.LatLng{Lat: lat, Lng: lng}, FeedResolution)
	if err != nil {
		return 0, 0, fmt.Errorf("cell for %f,%f: %w", lat, lng, err)
	}
	parent, err := cell.Parent(RefreshResolution)
	if err != nil {
		return 0, 0, fmt.Errorf("parent cell: %w", err)
	}
	return int64(cell), int64(parent), nil
}
