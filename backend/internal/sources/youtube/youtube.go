// Package youtube adapts the YouTube Data API v3 to the sources contract.
package youtube

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"nearbyfeed/internal/sources"
)

const (
	defaultBaseURL = "https://www.googleapis.com/youtube/v3"
	sourceName     = "youtube"
	maxBatch       = 50

	// Developer Policies III.E.4 require refreshing stored data within 30 days.
	refreshWindow = 25 * 24 * time.Hour
	maxBodyBytes  = 4 << 20
)

// Client calls the YouTube Data API.
type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
	now     func() time.Time
}

// New returns a client. Pass a custom transport to replay fixtures.
func New(apiKey string, transport http.RoundTripper) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: defaultBaseURL,
		http:    &http.Client{Transport: transport, Timeout: 15 * time.Second},
		now:     time.Now,
	}
}

// Name returns the source identifier stored on items.
func (c *Client) Name() string { return sourceName }

// Discover runs one geo search. It costs one call from the search.list bucket.
func (c *Client) Discover(ctx context.Context, q sources.GeoQuery) (sources.DiscoverResult, error) {
	params := url.Values{
		"part":           {"snippet"},
		"type":           {"video"},
		"location":       {fmt.Sprintf("%.6f,%.6f", q.Center.Lat, q.Center.Lng)},
		"locationRadius": {strconv.Itoa(q.RadiusM) + "m"},
		"order":          {"date"},
		"maxResults":     {strconv.Itoa(maxBatch)},
		"safeSearch":     {"strict"},
	}
	if !q.Since.IsZero() {
		params.Set("publishedAfter", q.Since.UTC().Format(time.RFC3339))
	}
	if q.Cursor != "" {
		params.Set("pageToken", q.Cursor)
	}

	var response searchResponse
	if err := c.get(ctx, "/search", params, &response); err != nil {
		return sources.DiscoverResult{}, err
	}

	result := sources.DiscoverResult{NextCursor: response.NextPageToken}
	for _, entry := range response.Items {
		if entry.ID.VideoID != "" {
			result.Refs = append(result.Refs, sources.Ref{ExternalID: entry.ID.VideoID})
		}
	}
	return result, nil
}

// Hydrate fetches video details in batches and normalizes them.
func (c *Client) Hydrate(ctx context.Context, refs []sources.Ref, q sources.GeoQuery) ([]sources.Item, error) {
	items := make([]sources.Item, 0, len(refs))
	for start := 0; start < len(refs); start += maxBatch {
		end := min(start+maxBatch, len(refs))
		ids := make([]string, 0, end-start)
		for _, ref := range refs[start:end] {
			ids = append(ids, ref.ExternalID)
		}

		params := url.Values{
			"part": {"snippet,recordingDetails,liveStreamingDetails,status,statistics"},
			"id":   {strings.Join(ids, ",")},
		}
		var response videosResponse
		if err := c.get(ctx, "/videos", params, &response); err != nil {
			return nil, err
		}

		fetchedAt := c.now().UTC()
		for _, video := range response.Items {
			if item, ok := Normalize(video, q, fetchedAt); ok {
				items = append(items, item)
			}
		}
	}
	return items, nil
}

// Normalize converts an API video to an item. It reports false for videos we
// must not show, such as ones that cannot be embedded in the official player.
func Normalize(video Video, q sources.GeoQuery, fetchedAt time.Time) (sources.Item, bool) {
	if !video.Status.Embeddable || video.Status.PrivacyStatus != "public" {
		return sources.Item{}, false
	}

	publishedAt, err := time.Parse(time.RFC3339, video.Snippet.PublishedAt)
	if err != nil {
		return sources.Item{}, false
	}

	kind := "video"
	if video.Snippet.LiveBroadcastContent == "live" {
		kind = "live"
	}

	thumbnail := video.Snippet.Thumbnails.best()
	return sources.Item{
		Source:     sourceName,
		ExternalID: video.ID,
		Kind:       kind,
		Title:      video.Snippet.Title,
		Body:       video.Snippet.Description,
		URL:        "https://www.youtube.com/watch?v=" + url.QueryEscape(video.ID),
		AuthorName: video.Snippet.ChannelTitle,
		AuthorURL:  "https://www.youtube.com/channel/" + url.PathEscape(video.Snippet.ChannelID),
		Media: []sources.Media{{
			Type:    "video",
			URL:     thumbnail.URL,
			Width:   thumbnail.Width,
			Height:  thumbnail.Height,
			EmbedID: video.ID,
		}},
		Geo:         Attribute(video, q),
		PublishedAt: publishedAt,
		FetchedAt:   fetchedAt,
		RefreshBy:   fetchedAt.Add(refreshWindow),
		SourceMeta: map[string]any{
			"channel_id":    video.Snippet.ChannelID,
			"made_for_kids": video.Status.MadeForKids,
		},
	}, true
}

// Attribute decides where a video is and how far to trust it. A video with no
// coordinates only proves it matched the search area, so it inherits the query
// centre and radius rather than claiming a precise location.
func Attribute(video Video, q sources.GeoQuery) sources.Attribution {
	location := video.RecordingDetails.Location
	if location != nil && location.Latitude != nil && location.Longitude != nil {
		return sources.Attribution{
			Point:      sources.LatLng{Lat: *location.Latitude, Lng: *location.Longitude},
			Method:     sources.GeoSourceTagged,
			Confidence: 0.9,
			RadiusM:    50,
			PlaceName:  video.RecordingDetails.LocationDescription,
		}
	}
	return sources.Attribution{
		Point:      q.Center,
		Method:     sources.GeoQueryArea,
		Confidence: 0.4,
		RadiusM:    q.RadiusM,
		PlaceName:  video.RecordingDetails.LocationDescription,
	}
}

func (c *Client) get(ctx context.Context, path string, params url.Values, out any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path+"?"+params.Encode(), nil)
	if err != nil {
		return err
	}
	// A header keeps the key out of URLs, which net/http errors would log.
	request.Header.Set("x-goog-api-key", c.apiKey)

	response, err := c.http.Do(request)
	if err != nil {
		return fmt.Errorf("youtube %s: %w", path, err)
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxBodyBytes))
	if err != nil {
		return fmt.Errorf("youtube %s: read body: %w", path, err)
	}

	if response.StatusCode != http.StatusOK {
		return classify(path, response.StatusCode, body)
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("youtube %s: decode: %w", path, err)
	}
	return nil
}

func classify(path string, status int, body []byte) error {
	var envelope errorResponse
	_ = json.Unmarshal(body, &envelope)

	reason := "unknown"
	if len(envelope.Error.Errors) > 0 {
		reason = envelope.Error.Errors[0].Reason
	}

	if status == http.StatusForbidden && (reason == "quotaExceeded" || reason == "dailyLimitExceeded") {
		return fmt.Errorf("youtube %s: %w", path, sources.ErrQuotaExceeded)
	}
	if status >= 400 && status < 500 && status != http.StatusTooManyRequests {
		return fmt.Errorf("youtube %s: %w", path, &sources.PermanentError{Status: status, Reason: reason})
	}
	return errors.New("youtube " + path + ": status " + strconv.Itoa(status) + ": " + reason)
}
