// Package config reads process configuration from the environment.
package config

import (
	"fmt"
	"os"
)

// Config holds settings shared by the api, worker and nfctl binaries.
type Config struct {
	AppEnv        string
	HTTPAddr      string
	DatabaseURL   string
	RedisAddr     string
	RedisPassword string
	ClickHouseDSN string
	TemporalAddr  string
	SourcesMode   string
	YouTubeAPIKey string
}

// Load returns the configuration, with defaults that match infra/compose.yaml.
func Load() (Config, error) {
	cfg := Config{
		AppEnv:        env("APP_ENV", "dev"),
		HTTPAddr:      env("HTTP_ADDR", "127.0.0.1:8080"),
		DatabaseURL:   env("DATABASE_URL", "postgres://nearbyfeed:nearbyfeed@127.0.0.1:54329/nearbyfeed?sslmode=disable"),
		RedisAddr:     env("REDIS_ADDR", "127.0.0.1:63799"),
		RedisPassword: env("REDIS_PASSWORD", "nearbyfeed"),
		ClickHouseDSN: env("CLICKHOUSE_DSN", "clickhouse://nearbyfeed:nearbyfeed@127.0.0.1:19000/nearbyfeed_observability"),
		// 7233 is commonly held by another local Temporal dev server.
		TemporalAddr:  env("TEMPORAL_ADDR", "127.0.0.1:7234"),
		SourcesMode:   env("SOURCES_MODE", "fixture"),
		YouTubeAPIKey: os.Getenv("YOUTUBE_API_KEY"),
	}

	if cfg.SourcesMode != "fixture" && cfg.SourcesMode != "live" {
		return Config{}, fmt.Errorf("SOURCES_MODE must be fixture or live, got %q", cfg.SourcesMode)
	}
	if cfg.SourcesMode == "live" && cfg.YouTubeAPIKey == "" {
		return Config{}, fmt.Errorf("SOURCES_MODE=live requires YOUTUBE_API_KEY")
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
