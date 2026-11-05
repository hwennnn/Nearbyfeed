// Command worker runs NearbyFeed's Temporal ingestion worker.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"

	"nearbyfeed/internal/config"
	"nearbyfeed/internal/feed"
	"nearbyfeed/internal/ingest"
	"nearbyfeed/internal/quota"
	"nearbyfeed/internal/sources/fixtures"
	"nearbyfeed/internal/sources/youtube"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("worker stopped", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer rdb.Close()

	tracker, err := quota.New(rdb)
	if err != nil {
		return err
	}

	var transport http.RoundTripper = http.DefaultTransport
	if cfg.SourcesMode == "fixture" {
		transport = fixtures.YouTube{Now: time.Now}
		logger.Warn("using fixture sources: content is synthetic")
	}

	temporalClient, err := client.Dial(client.Options{HostPort: cfg.TemporalAddr, Logger: logger})
	if err != nil {
		return err
	}
	defer temporalClient.Close()

	w := worker.New(temporalClient, ingest.TaskQueue, worker.Options{})
	w.RegisterWorkflow(ingest.RefreshWorkflow)
	w.RegisterActivity(&ingest.Activities{
		Source: youtube.New(cfg.YouTubeAPIKey, transport),
		Store:  feed.NewStore(pool),
		Quota:  tracker,
	})
	return w.Run(worker.InterruptCh())
}
