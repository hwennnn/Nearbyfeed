package feed

import (
	"errors"
	"testing"
	"time"
)

func TestCursorRoundTrip(t *testing.T) {
	want := cursor{publishedAt: time.UnixMicro(1793914126834123), id: 42, radiusM: 5000}

	got, err := decodeCursor(want.encode())

	if err != nil {
		t.Fatal(err)
	}
	if !got.publishedAt.Equal(want.publishedAt) || got.id != want.id || got.radiusM != want.radiusM {
		t.Fatalf("got %+v, want %+v", got, want)
	}
}

func TestDecodeCursorRejectsForgedValues(t *testing.T) {
	for _, value := range []string{"!!!", "MTIz", "YTpiOmM", "MTow", "MTowOjA"} {
		if _, err := decodeCursor(value); !errors.Is(err, ErrInvalidCursor) {
			t.Errorf("%q: got %v, want ErrInvalidCursor", value, err)
		}
	}
}

func TestWindowStartsAlwaysEndAtOldest(t *testing.T) {
	anchor := time.Date(2026, 11, 5, 12, 0, 0, 0, time.UTC)

	cases := []struct {
		name   string
		oldest time.Time
		want   int
	}{
		{"30 day range uses every step", anchor.Add(-30 * 24 * time.Hour), 5},
		{"1 hour range needs one search", anchor.Add(-time.Hour), 1},
		{"range between steps stops early", anchor.Add(-2 * time.Hour), 2},
		{"cursor older than range still searches", anchor.Add(time.Hour), 1},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			starts := windowStarts(anchor, tc.oldest)

			if len(starts) != tc.want {
				t.Fatalf("got %d starts, want %d: %v", len(starts), tc.want, starts)
			}
			if last := starts[len(starts)-1]; !last.Equal(tc.oldest) {
				t.Fatalf("last start %s, want %s", last, tc.oldest)
			}
			for i := 1; i < len(starts); i++ {
				if !starts[i].Before(starts[i-1]) {
					t.Fatalf("starts must move back in time: %v", starts)
				}
			}
		})
	}
}
