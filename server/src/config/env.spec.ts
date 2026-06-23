import { resolve } from 'path';
import { getCorsOptions, getEnvFilePaths, getPort } from './env';

describe('env config helpers', () => {
  it('loads .env first so it can override the app-specific env file', () => {
    expect(getEnvFilePaths({ APP_ENV: 'staging' })).toEqual([
      resolve(process.cwd(), '.env'),
      resolve(process.cwd(), '.env.staging'),
    ]);
  });

  it('defaults local development to .env.development', () => {
    expect(getEnvFilePaths({})).toContain(
      resolve(process.cwd(), '.env.development'),
    );
  });

  it('falls back to port 3000 when PORT is missing or invalid', () => {
    expect(getPort({})).toBe(3000);
    expect(getPort({ PORT: 'not-a-number' })).toBe(3000);
    expect(getPort({ PORT: '4000' })).toBe(4000);
  });

  it('allows local web origins by default outside production', () => {
    expect(getCorsOptions({}).origin).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]);
  });

  it('normalizes and dedupes configured CORS origins', () => {
    expect(
      getCorsOptions({
        CORS_ORIGINS:
          ' https://app.nearbyfeed.com/,http://localhost:5174,https://app.nearbyfeed.com ',
        WEB_ORIGIN: 'https://staging.nearbyfeed.com/',
      }).origin,
    ).toEqual([
      'https://app.nearbyfeed.com',
      'http://localhost:5174',
      'https://staging.nearbyfeed.com',
    ]);
  });

  it('fails closed for production when CORS origins are not configured', () => {
    expect(getCorsOptions({ NODE_ENV: 'production' }).origin).toBe(false);
  });
});
