import { Env } from '@env';
import axios from 'axios';

const geolocationClient = axios.create({
  baseURL: Env.NOMINATIM_OPENSTREETMAP_ENDPOINT,
  headers: { 'Content-Type': 'application/json' },
});

export { geolocationClient };
