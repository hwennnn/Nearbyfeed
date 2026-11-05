// Package fixtures fakes external APIs at the HTTP layer, so adapters run their
// real request and parsing code without credentials.
package fixtures

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const videosPerSearch = 12

// YouTube answers search and videos requests with synthetic data placed around
// the requested location. Every title is marked, so fixture content can never
// be mistaken for real content, and the IDs do not exist on YouTube.
type YouTube struct {
	Now func() time.Time
}

// RoundTrip implements http.RoundTripper.
func (y YouTube) RoundTrip(request *http.Request) (*http.Response, error) {
	var body any
	var err error

	switch {
	case strings.HasSuffix(request.URL.Path, "/search"):
		body, err = y.search(request)
	case strings.HasSuffix(request.URL.Path, "/videos"):
		body = y.videos(request)
	default:
		err = fmt.Errorf("fixture has no route for %s", request.URL.Path)
	}
	if err != nil {
		return nil, err
	}

	encoded, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": {"application/json"}},
		Body:       io.NopCloser(strings.NewReader(string(encoded))),
		Request:    request,
	}, nil
}

func (y YouTube) search(request *http.Request) (any, error) {
	parts := strings.Split(request.URL.Query().Get("location"), ",")
	if len(parts) != 2 {
		return nil, fmt.Errorf("fixture search needs a location")
	}

	items := make([]map[string]any, 0, videosPerSearch)
	for n := range videosPerSearch {
		// Coordinates travel inside the ID so /videos can answer statelessly.
		id := fmt.Sprintf("fx_%s_%s_%d", parts[0], parts[1], n)
		items = append(items, map[string]any{"id": map[string]string{"videoId": id}})
	}
	return map[string]any{"items": items}, nil
}

func (y YouTube) videos(request *http.Request) any {
	ids := strings.Split(request.URL.Query().Get("id"), ",")
	items := make([]map[string]any, 0, len(ids))
	for _, id := range ids {
		if video, ok := y.video(id); ok {
			items = append(items, video)
		}
	}
	return map[string]any{"items": items}
}

func (y YouTube) video(id string) (map[string]any, bool) {
	parts := strings.Split(id, "_")
	if len(parts) != 4 {
		return nil, false
	}
	lat, errLat := strconv.ParseFloat(parts[1], 64)
	lng, errLng := strconv.ParseFloat(parts[2], 64)
	n, errN := strconv.Atoi(parts[3])
	if errLat != nil || errLng != nil || errN != nil {
		return nil, false
	}

	title := fmt.Sprintf("[Fixture] Sample video %d", n+1)
	video := map[string]any{
		"id": id,
		"snippet": map[string]any{
			"publishedAt":          y.Now().Add(-time.Duration(n*37) * time.Minute).UTC().Format(time.RFC3339),
			"channelId":            "fixture-channel",
			"channelTitle":         "Fixture Channel",
			"title":                title,
			"description":          "Synthetic content for local development.",
			"liveBroadcastContent": "none",
			"thumbnails": map[string]any{
				"high": map[string]any{"url": thumbnail(title), "width": 480, "height": 360},
			},
		},
		"status": map[string]any{"privacyStatus": "public", "embeddable": true},
	}

	// Mirror the real mix: only some videos carry coordinates.
	if n%3 != 0 {
		video["recordingDetails"] = map[string]any{
			"location": map[string]float64{
				"latitude":  lat + float64(n%5-2)*0.006,
				"longitude": lng + float64(n%7-3)*0.006,
			},
		}
	}
	return video, true
}

func thumbnail(title string) string {
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">`+
		`<rect width="480" height="360" fill="#1f2937"/>`+
		`<text x="240" y="185" fill="#9ca3af" font-family="sans-serif" font-size="22" text-anchor="middle">%s</text></svg>`, title)
	return "data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString([]byte(svg))
}
