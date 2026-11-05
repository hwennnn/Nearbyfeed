package youtube

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"nearbyfeed/internal/sources"
)

type stubTransport struct {
	status int
	body   string
	last   *http.Request
}

func (s *stubTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	s.last = request
	return &http.Response{
		StatusCode: s.status,
		Body:       io.NopCloser(strings.NewReader(s.body)),
		Header:     http.Header{},
		Request:    request,
	}, nil
}

func query() sources.GeoQuery {
	return sources.GeoQuery{Center: sources.LatLng{Lat: 1.35, Lng: 103.82}, RadiusM: 12000}
}

func video() Video {
	return Video{
		ID: "abc123",
		Snippet: Snippet{
			PublishedAt:  "2026-11-01T10:00:00Z",
			ChannelID:    "chan",
			ChannelTitle: "Channel",
			Title:        "Title",
		},
		Status: Status{PrivacyStatus: "public", Embeddable: true},
	}
}

func TestAttributeUsesTaggedCoordinates(t *testing.T) {
	lat, lng := 1.29, 103.85
	v := video()
	v.RecordingDetails.Location = &Location{Latitude: &lat, Longitude: &lng}

	got := Attribute(v, query())

	if got.Method != sources.GeoSourceTagged || got.Point.Lat != lat || got.RadiusM != 50 {
		t.Fatalf("unexpected attribution: %+v", got)
	}
}

func TestAttributeKeepsZeroCoordinates(t *testing.T) {
	zero := 0.0
	v := video()
	v.RecordingDetails.Location = &Location{Latitude: &zero, Longitude: &zero}

	if got := Attribute(v, query()); got.Method != sources.GeoSourceTagged {
		t.Fatalf("0,0 is a real coordinate, got %+v", got)
	}
}

func TestAttributeFallsBackToQueryArea(t *testing.T) {
	got := Attribute(video(), query())

	if got.Method != sources.GeoQueryArea || got.Confidence != 0.4 || got.RadiusM != 12000 {
		t.Fatalf("unexpected attribution: %+v", got)
	}
	if got.Point != query().Center {
		t.Fatalf("expected query centre, got %+v", got.Point)
	}
}

func TestNormalizeDropsVideosThatCannotBeShown(t *testing.T) {
	notEmbeddable := video()
	notEmbeddable.Status.Embeddable = false
	private := video()
	private.Status.PrivacyStatus = "private"
	badDate := video()
	badDate.Snippet.PublishedAt = "yesterday"

	for name, v := range map[string]Video{"embed": notEmbeddable, "private": private, "date": badDate} {
		if _, ok := Normalize(v, query(), time.Now()); ok {
			t.Errorf("%s: expected video to be dropped", name)
		}
	}
}

func TestNormalizeSetsRefreshDeadlineInsidePolicyWindow(t *testing.T) {
	fetched := time.Date(2026, 11, 5, 0, 0, 0, 0, time.UTC)

	item, ok := Normalize(video(), query(), fetched)

	if !ok {
		t.Fatal("expected video to normalize")
	}
	if limit := fetched.Add(30 * 24 * time.Hour); !item.RefreshBy.Before(limit) {
		t.Fatalf("refresh_by %s is not within 30 days", item.RefreshBy)
	}
}

func TestNormalizeMarksLiveVideos(t *testing.T) {
	v := video()
	v.Snippet.LiveBroadcastContent = "live"

	if item, _ := Normalize(v, query(), time.Now()); item.Kind != "live" {
		t.Fatalf("expected live kind, got %q", item.Kind)
	}
}

func TestAPIKeyNeverAppearsInURL(t *testing.T) {
	transport := &stubTransport{status: http.StatusOK, body: `{"items":[]}`}
	client := New("secret-key", transport)

	if _, err := client.Discover(context.Background(), query()); err != nil {
		t.Fatal(err)
	}

	if strings.Contains(transport.last.URL.String(), "secret-key") {
		t.Fatal("API key leaked into the request URL")
	}
	if transport.last.Header.Get("x-goog-api-key") != "secret-key" {
		t.Fatal("API key missing from request header")
	}
}

func TestDiscoverSendsGeoParameters(t *testing.T) {
	transport := &stubTransport{status: http.StatusOK, body: `{"nextPageToken":"n","items":[{"id":{"videoId":"v1"}},{"id":{}}]}`}
	client := New("key", transport)

	result, err := client.Discover(context.Background(), query())
	if err != nil {
		t.Fatal(err)
	}

	values := transport.last.URL.Query()
	if values.Get("locationRadius") != "12000m" || values.Get("type") != "video" || values.Get("safeSearch") != "strict" {
		t.Fatalf("unexpected query: %s", transport.last.URL.RawQuery)
	}
	if len(result.Refs) != 1 || result.Refs[0].ExternalID != "v1" || result.NextCursor != "n" {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestErrorClassification(t *testing.T) {
	quotaBody := `{"error":{"errors":[{"reason":"quotaExceeded"}]}}`
	badBody := `{"error":{"errors":[{"reason":"invalidLocation"}]}}`

	cases := []struct {
		name      string
		status    int
		body      string
		quota     bool
		permanent bool
	}{
		{"quota", http.StatusForbidden, quotaBody, true, false},
		{"bad request", http.StatusBadRequest, badBody, false, true},
		{"rate limited stays retryable", http.StatusTooManyRequests, "", false, false},
		{"server error stays retryable", http.StatusBadGateway, "not json", false, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			client := New("key", &stubTransport{status: tc.status, body: tc.body})

			_, err := client.Discover(context.Background(), query())

			if err == nil {
				t.Fatal("expected an error")
			}
			var permanent *sources.PermanentError
			if got := errors.Is(err, sources.ErrQuotaExceeded); got != tc.quota {
				t.Errorf("quota = %v, want %v (%v)", got, tc.quota, err)
			}
			if got := errors.As(err, &permanent); got != tc.permanent {
				t.Errorf("permanent = %v, want %v (%v)", got, tc.permanent, err)
			}
		})
	}
}
