# NearbyFeed Web

Production-oriented React + TypeScript web app for NearbyFeed.

```bash
npm install
npm run dev
npm test
npm run build
```

Environment:

```bash
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=pk.your-public-mapbox-token
```

The app renders useful demo data when the API is offline, but live posts, comments, auth, TinyFish/X updates, and ClickHouse observability are all API-backed when the server is running.
