// Constant-rate feed reads at random points across three metros.
// BASE_URL, TARGET (legacy|v1), RATE and DURATION are set from the environment.
import http from 'k6/http';
import { check } from 'k6';

const TARGET = __ENV.TARGET || 'v1';
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const RATE = Number(__ENV.RATE || 200);
const DURATION = __ENV.DURATION || '60s';
const RADIUS = Number(__ENV.RADIUS || 1000);

// SPARSE=1 reads where no seeded content exists. A location feed spends most
// of its life in places like this, and it is the worst case for a scan: there
// is no early exit from finding a full page of matches.
const METROS =
  __ENV.SPARSE === '1'
    ? [{ lat: -33.8688, lng: 151.2093 }]
    : [
        { lat: 1.3521, lng: 103.8198 },
        { lat: 40.7128, lng: -74.006 },
        { lat: 51.5074, lng: -0.1278 },
      ];

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    feed: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Math.max(50, RATE),
      maxVUs: Math.max(200, RATE * 5),
    },
  },
};

function jitter(spread) {
  return (Math.random() - 0.5) * spread;
}

export default function () {
  const metro = METROS[Math.floor(Math.random() * METROS.length)];
  const lat = metro.lat + jitter(0.2);
  const lng = metro.lng + jitter(0.2);

  const url =
    TARGET === 'legacy'
      ? `${BASE_URL}/posts?latitude=${lat}&longitude=${lng}&distance=1000&take=15`
      : `${BASE_URL}/v1/feed?lat=${lat}&lng=${lng}&radius_m=${RADIUS}&limit=15&window=30d`;

  const res = http.get(url, { timeout: '30s' });
  check(res, { 'status is 200': (r) => r.status === 200 });
}
