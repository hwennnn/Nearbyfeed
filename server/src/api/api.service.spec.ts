import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ApiService } from './api.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeConfigService = (values: Record<string, string | undefined> = {}) =>
  ({
    get: jest.fn((key: string) => values[key]),
  }) as unknown as ConfigService;

describe('ApiService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('applies a default timeout to outbound GET requests', async () => {
    mockedAxios.get.mockResolvedValue({ data: { ok: true } });
    const service = new ApiService(
      'https://nominatim.openstreetmap.org',
      makeConfigService(),
    );

    await expect(
      service.get('/reverse', { lat: 37.323 }, { 'User-Agent': 'NearbyFeed' }),
    ).resolves.toEqual({ ok: true });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://nominatim.openstreetmap.org/reverse',
      {
        headers: { 'User-Agent': 'NearbyFeed' },
        params: { lat: 37.323 },
        timeout: 10000,
      },
    );
  });

  it('uses API_TIMEOUT_MS when configured', async () => {
    mockedAxios.post.mockResolvedValue({ data: { created: true } });
    const service = new ApiService(
      'https://api.nearbyfeed.test/',
      makeConfigService({ API_TIMEOUT_MS: '2500' }),
    );

    await expect(service.post('/events', { name: 'api.request' })).resolves.toEqual({
      created: true,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.nearbyfeed.test/events',
      { name: 'api.request' },
      { timeout: 2500 },
    );
  });

  it('falls back to the default timeout when API_TIMEOUT_MS is invalid', async () => {
    mockedAxios.get.mockResolvedValue({ data: { ok: true } });
    const service = new ApiService(
      'https://api.nearbyfeed.test',
      makeConfigService({ API_TIMEOUT_MS: 'forever' }),
    );

    await service.get('/health');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.nearbyfeed.test/health',
      {
        headers: undefined,
        params: undefined,
        timeout: 10000,
      },
    );
  });
});
