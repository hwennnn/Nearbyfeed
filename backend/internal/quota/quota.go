// Package quota tracks daily API allowances in Redis.
package quota

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ErrExhausted means a reservation would pass the daily limit.
var ErrExhausted = errors.New("daily quota exhausted")

// Counters expire after the period ends; two days covers any clock skew.
const counterTTL = 48 * time.Hour

// reserveScript adds units only if the total stays within the limit, atomically,
// so concurrent workers cannot overspend.
var reserveScript = redis.NewScript(`
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local units = tonumber(ARGV[1])
if used + units > tonumber(ARGV[2]) then
  return -1
end
local total = redis.call('INCRBY', KEYS[1], units)
redis.call('EXPIRE', KEYS[1], ARGV[3])
return total
`)

// Tracker reserves units against per-source buckets.
type Tracker struct {
	redis    *redis.Client
	location *time.Location
	now      func() time.Time
}

// New returns a tracker. YouTube quotas reset at midnight Pacific Time.
func New(client *redis.Client) (*Tracker, error) {
	location, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		return nil, fmt.Errorf("load quota timezone: %w", err)
	}
	return &Tracker{redis: client, location: location, now: time.Now}, nil
}

func (t *Tracker) key(source, bucket string) string {
	return fmt.Sprintf("quota:%s:%s:%s", source, bucket, t.now().In(t.location).Format("2006-01-02"))
}

// Reserve spends units from a bucket, or returns ErrExhausted.
func (t *Tracker) Reserve(ctx context.Context, source, bucket string, units, limit int) error {
	keys := []string{t.key(source, bucket)}
	result, err := reserveScript.Run(ctx, t.redis, keys, units, limit, int(counterTTL.Seconds())).Int()
	if err != nil {
		return fmt.Errorf("reserve quota: %w", err)
	}
	if result < 0 {
		return ErrExhausted
	}
	return nil
}

// Exhaust pins a bucket at its limit, after the source itself reports that the
// quota ran out and our count has drifted from theirs.
func (t *Tracker) Exhaust(ctx context.Context, source, bucket string, limit int) error {
	return t.redis.Set(ctx, t.key(source, bucket), limit, counterTTL).Err()
}

// Used returns units spent so far in the current period.
func (t *Tracker) Used(ctx context.Context, source, bucket string) (int, error) {
	used, err := t.redis.Get(ctx, t.key(source, bucket)).Int()
	if errors.Is(err, redis.Nil) {
		return 0, nil
	}
	return used, err
}
