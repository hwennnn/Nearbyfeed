// Package ingest pulls external content into the feed through Temporal.
package ingest

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"

	"nearbyfeed/internal/feed"
	"nearbyfeed/internal/quota"
	"nearbyfeed/internal/sources"
)

const (
	// TaskQueue is the queue every ingestion worker polls.
	TaskQueue = "ingest"

	searchBucket = "search"
	videosBucket = "read"

	// Google's default allowances for a project.
	searchDailyLimit = 100
	readDailyLimit   = 10000

	errTypeQuota     = "quota_exhausted"
	errTypePermanent = "source_rejected"

	lookback = 7 * 24 * time.Hour
)

// RefreshInput names the area to refresh.
type RefreshInput struct {
	Lat     float64
	Lng     float64
	RadiusM int
}

// RefreshResult reports what a refresh did.
type RefreshResult struct {
	Discovered int
	New        int
	Updated    int
}

// Activities holds the dependencies of ingestion activities.
type Activities struct {
	Source sources.Source
	Store  *feed.Store
	Quota  *quota.Tracker
}

// RefreshWorkflow discovers content around a point and stores it. The workflow
// ID is the dedupe: concurrent demand for one cell joins a single run.
func RefreshWorkflow(ctx workflow.Context, input RefreshInput) (RefreshResult, error) {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:        time.Second,
			BackoffCoefficient:     2,
			MaximumAttempts:        5,
			NonRetryableErrorTypes: []string{errTypeQuota, errTypePermanent},
		},
	})

	var activities *Activities

	var refs []sources.Ref
	if err := workflow.ExecuteActivity(ctx, activities.Discover, input).Get(ctx, &refs); err != nil {
		return RefreshResult{}, err
	}
	if len(refs) == 0 {
		return RefreshResult{}, nil
	}

	var result RefreshResult
	if err := workflow.ExecuteActivity(ctx, activities.HydrateAndStore, input, refs).Get(ctx, &result); err != nil {
		return RefreshResult{}, err
	}
	result.Discovered = len(refs)
	return result, nil
}

func (input RefreshInput) query() sources.GeoQuery {
	return sources.GeoQuery{
		Center:  sources.LatLng{Lat: input.Lat, Lng: input.Lng},
		RadiusM: input.RadiusM,
		Since:   time.Now().Add(-lookback),
	}
}

// Discover spends one search call. A retry spends another, because the source
// charges for every attempt.
func (a *Activities) Discover(ctx context.Context, input RefreshInput) ([]sources.Ref, error) {
	name := a.Source.Name()
	if err := a.Quota.Reserve(ctx, name, searchBucket, 1, searchDailyLimit); err != nil {
		return nil, a.classify(ctx, err, searchBucket, searchDailyLimit)
	}

	result, err := a.Source.Discover(ctx, input.query())
	if err != nil {
		return nil, a.classify(ctx, err, searchBucket, searchDailyLimit)
	}
	return result.Refs, nil
}

// HydrateAndStore fetches details and writes them in one step, so source
// metadata never enters Temporal's history, where retention rules would not
// reach it.
func (a *Activities) HydrateAndStore(ctx context.Context, input RefreshInput, refs []sources.Ref) (RefreshResult, error) {
	name := a.Source.Name()
	calls := (len(refs) + 49) / 50
	if err := a.Quota.Reserve(ctx, name, videosBucket, calls, readDailyLimit); err != nil {
		return RefreshResult{}, a.classify(ctx, err, videosBucket, readDailyLimit)
	}

	items, err := a.Source.Hydrate(ctx, refs, input.query())
	if err != nil {
		return RefreshResult{}, a.classify(ctx, err, videosBucket, readDailyLimit)
	}

	inserted, updated, err := a.Store.Upsert(ctx, items)
	if err != nil {
		return RefreshResult{}, fmt.Errorf("store items: %w", err)
	}
	return RefreshResult{New: inserted, Updated: updated}, nil
}

func (a *Activities) classify(ctx context.Context, err error, bucket string, limit int) error {
	var permanent *sources.PermanentError
	switch {
	case errors.Is(err, quota.ErrExhausted):
		return temporal.NewNonRetryableApplicationError(err.Error(), errTypeQuota, err)
	case errors.Is(err, sources.ErrQuotaExceeded):
		if pinErr := a.Quota.Exhaust(ctx, a.Source.Name(), bucket, limit); pinErr != nil {
			return errors.Join(err, pinErr)
		}
		return temporal.NewNonRetryableApplicationError(err.Error(), errTypeQuota, err)
	case errors.As(err, &permanent):
		return temporal.NewNonRetryableApplicationError(err.Error(), errTypePermanent, err)
	default:
		return err
	}
}
