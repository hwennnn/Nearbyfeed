// Command api serves the NearbyFeed HTTP API.
package main

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/redis/go-redis/v9"

	"nearbyfeed/db"
	"nearbyfeed/internal/config"
	"nearbyfeed/internal/feed"
	"nearbyfeed/internal/httpapi"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("api stopped", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return err
	}
	// After five runs a prepared statement can move to a generic plan, which
	// cannot see the radius or window and so cannot pick the right index.
	poolConfig.ConnConfig.RuntimeParams["plan_cache_mode"] = "force_custom_plan"

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return err
	}
	defer pool.Close()

	if err := migrate(pool); err != nil {
		return err
	}

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		checkCtx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := errors.Join(pool.Ping(checkCtx), rdb.Ping(checkCtx).Err()); err != nil {
			logger.Warn("readiness check failed", "error", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})

	mux.Handle("GET /v1/feed", httpapi.FeedHandler{Store: feed.NewStore(pool), Logger: logger})

	server := &http.Server{Addr: cfg.HTTPAddr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	serveErr := make(chan error, 1)
	go func() { serveErr <- server.ListenAndServe() }()
	logger.Info("api listening", "addr", cfg.HTTPAddr)

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return server.Shutdown(shutdownCtx)
}

func migrate(pool *pgxpool.Pool) error {
	var conn *sql.DB = stdlib.OpenDBFromPool(pool)
	defer conn.Close()

	goose.SetBaseFS(db.Migrations)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(conn, "migrations")
}
