import { getJwtSecret } from './jwt-config';

describe('getJwtSecret', () => {
  const configService = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as any;

  it('uses configured JWT secrets when present', () => {
    expect(
      getJwtSecret(
        configService({ JWT_ACCESS_SECRET: 'configured-secret' }),
        'JWT_ACCESS_SECRET',
      ),
    ).toBe('configured-secret');
  });

  it('allows deterministic development-only fallback secrets', () => {
    expect(
      getJwtSecret(
        configService({ APP_ENV: 'development', JWT_ACCESS_SECRET: '' }),
        'JWT_ACCESS_SECRET',
      ),
    ).toBe('nearbyfeed-jwt-access-secret-dev-secret');
  });

  it('fails fast outside development when a JWT secret is missing', () => {
    expect(() =>
      getJwtSecret(
        configService({ APP_ENV: 'production', JWT_REFRESH_SECRET: '' }),
        'JWT_REFRESH_SECRET',
      ),
    ).toThrow('JWT_REFRESH_SECRET is required');
  });
});
