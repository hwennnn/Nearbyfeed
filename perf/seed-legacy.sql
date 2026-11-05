-- Seeds the legacy Prisma schema with synthetic posts across three metros.
-- Run against the throwaway nearbyfeed_legacy database only.
INSERT INTO "User" (username, email, "updatedAt")
SELECT 'seed' || n, 'seed' || n || '@example.invalid', now()
FROM generate_series(1, 1000) AS n
ON CONFLICT (email) DO NOTHING;

WITH metros (lat, lng) AS (
  VALUES (1.3521, 103.8198), (40.7128, -74.0060), (51.5074, -0.1278)
),
author_ids AS (
  SELECT array_agg(id) AS ids FROM "User"
)
INSERT INTO "Post" (title, content, latitude, longitude, "authorId", "createdAt", "updatedAt", images)
SELECT
  'Seed post ' || n,
  'Synthetic baseline content ' || n,
  m.lat + (random() - 0.5) * 0.5,
  m.lng + (random() - 0.5) * 0.5,
  a.ids[1 + (n % array_length(a.ids, 1))],
  now() - random() * interval '30 days',
  now(),
  '{}'
FROM generate_series(1, 200000) AS n
CROSS JOIN author_ids AS a
CROSS JOIN LATERAL (
  SELECT lat, lng FROM metros OFFSET (n % 3) LIMIT 1
) AS m;

ANALYZE "Post";
