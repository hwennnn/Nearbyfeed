// Command nfctl holds operator tasks for NearbyFeed.
package main

import (
	"context"
	"flag"
	"fmt"
	"math/rand/v2"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.temporal.io/api/enums/v1"
	"go.temporal.io/sdk/client"

	"nearbyfeed/internal/config"
	"nearbyfeed/internal/geo"
	"nearbyfeed/internal/ingest"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: nfctl seed --count N | refresh --lat L --lng L [--radius M]")
		os.Exit(2)
	}

	var err error
	switch os.Args[1] {
	case "seed":
		err = seed(os.Args[2:])
	case "refresh":
		err = refresh(os.Args[2:])
	default:
		err = fmt.Errorf("unknown command %q", os.Args[1])
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

// refresh starts an ingestion run for one area and waits for it to finish.
func refresh(args []string) error {
	flags := flag.NewFlagSet("refresh", flag.ContinueOnError)
	lat := flags.Float64("lat", 1.3521, "latitude")
	lng := flags.Float64("lng", 103.8198, "longitude")
	radius := flags.Int("radius", 12000, "search radius in metres")
	if err := flags.Parse(args); err != nil {
		return err
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	_, r5, err := geo.Cells(*lat, *lng)
	if err != nil {
		return err
	}

	temporalClient, err := client.Dial(client.Options{HostPort: cfg.TemporalAddr})
	if err != nil {
		return err
	}
	defer temporalClient.Close()

	ctx := context.Background()
	run, err := temporalClient.ExecuteWorkflow(ctx, client.StartWorkflowOptions{
		ID:                       fmt.Sprintf("refresh:youtube:%x", r5),
		TaskQueue:                ingest.TaskQueue,
		WorkflowIDConflictPolicy: enums.WORKFLOW_ID_CONFLICT_POLICY_USE_EXISTING,
	}, ingest.RefreshWorkflow, ingest.RefreshInput{Lat: *lat, Lng: *lng, RadiusM: *radius})
	if err != nil {
		return err
	}

	var result ingest.RefreshResult
	if err := run.Get(ctx, &result); err != nil {
		return err
	}
	fmt.Printf("workflow %s: discovered %d, new %d, updated %d\n",
		run.GetID(), result.Discovered, result.New, result.Updated)
	return nil
}

// seed loads synthetic items with the same metro layout as perf/seed-legacy.sql,
// so results compare directly with the legacy baseline.
func seed(args []string) error {
	flags := flag.NewFlagSet("seed", flag.ContinueOnError)
	count := flags.Int("count", 1_000_000, "items to create")
	if err := flags.Parse(args); err != nil {
		return err
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if cfg.AppEnv != "dev" {
		return fmt.Errorf("seed only runs with APP_ENV=dev, got %q", cfg.AppEnv)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	conn, err := pool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	_, err = conn.Exec(ctx, `CREATE TEMP TABLE seed_items (
		n bigint, lat double precision, lng double precision,
		h3_r8 bigint, h3_r5 bigint, published_at timestamptz)`)
	if err != nil {
		return err
	}

	metros := [][2]float64{{1.3521, 103.8198}, {40.7128, -74.006}, {51.5074, -0.1278}}
	now := time.Now()
	batchID := now.UnixNano()

	rows := make([][]any, 0, *count)
	for n := range *count {
		metro := metros[n%len(metros)]
		lat := metro[0] + (rand.Float64()-0.5)*0.5
		lng := metro[1] + (rand.Float64()-0.5)*0.5
		r8, r5, err := geo.Cells(lat, lng)
		if err != nil {
			return err
		}
		age := time.Duration(rand.Int64N(int64(30 * 24 * time.Hour)))
		rows = append(rows, []any{int64(n), lat, lng, r8, r5, now.Add(-age)})
	}

	columns := []string{"n", "lat", "lng", "h3_r8", "h3_r5", "published_at"}
	copied, err := conn.CopyFrom(ctx, pgx.Identifier{"seed_items"}, columns, pgx.CopyFromRows(rows))
	if err != nil {
		return err
	}

	_, err = conn.Exec(ctx, `
		INSERT INTO items (source, external_id, kind, title, body, geog, geo_method,
		                   geo_confidence, h3_r8, h3_r5, published_at)
		SELECT 'seed', $1::text || '-' || n, 'post', 'Seed post ' || n,
		       'Synthetic baseline content ' || n,
		       ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
		       'device', 1, h3_r8, h3_r5, published_at
		FROM seed_items`, fmt.Sprint(batchID))
	if err != nil {
		return err
	}
	if _, err = conn.Exec(ctx, `ANALYZE items`); err != nil {
		return err
	}

	fmt.Printf("seeded %d items\n", copied)
	return nil
}
