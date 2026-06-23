import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is a no-op when observability is disabled', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) =>
          key === 'OBSERVABILITY_ENABLED' ? 'false' : undefined,
        ),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({ name: 'web.map_viewed' });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('formats ClickHouse DateTime64 event timestamps', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-23T07:58:00.123Z'));
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_DATABASE: 'nearbyfeed_observability',
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({ name: 'api.request', route: '/posts' });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body.trim())).toEqual(
      expect.objectContaining({
        event_time: '2026-06-23 07:58:00.123',
      }),
    );
  });

  it('redacts sensitive query values from client-provided event routes', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.details_viewed',
      route: '/details?postId=42&token=secret-token&password=hunter2',
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body.trim())).toEqual(
      expect.objectContaining({
        route: '/details?postId=42&token=[redacted]&password=[redacted]',
      }),
    );
  });

  it('uses valid client timestamps when they are close to server time', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-23T08:00:00.000Z'));
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.map_viewed',
      clientTimestamp: '2026-06-23T07:59:44.987Z',
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body.trim())).toEqual(
      expect.objectContaining({
        event_time: '2026-06-23 07:59:44.987',
      }),
    );
  });

  it('falls back to server time when client timestamps are too skewed', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-23T08:00:00.000Z'));
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.map_viewed',
      clientTimestamp: '2026-06-25T08:00:00.000Z',
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    const row = JSON.parse(body.trim()) as { event_time: string; properties: string };
    const properties = JSON.parse(row.properties) as Record<string, unknown>;

    expect(row.event_time).toBe('2026-06-23 08:00:00.000');
    expect(properties.clientTimestampRejected).toBe(true);
    expect(properties.clientTimestampSkewMs).toBe(172800000);
  });

  it('preserves server timestamp audit properties when client properties hit the storage budget', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-23T08:00:00.000Z'));
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.map_viewed',
      clientTimestamp: '2026-06-25T08:00:00.000Z',
      properties: Object.fromEntries(
        Array.from({ length: 24 }, (_, index) => [`client_${index}`, index]),
      ),
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    const row = JSON.parse(body.trim()) as { properties: string };
    const properties = JSON.parse(row.properties) as Record<string, unknown>;

    expect(Object.keys(properties)).toHaveLength(24);
    expect(properties.clientTimestampRejected).toBe(true);
    expect(properties.clientTimestampSkewMs).toBe(172800000);
  });

  it('bounds and normalizes client-provided event properties before insert', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );
    const longKey =
      'this_key_is_longer_than_the_observability_storage_budget_and_should_be_trimmed';
    const properties: Record<string, unknown> = {
      [longKey]: 'kept',
      longText: 'x'.repeat(800),
      nested: {
        deep: {
          payload: 'kept as a string',
        },
      },
      undefinedValue: undefined,
    };
    Object.assign(
      properties,
      Object.fromEntries(
        Array.from({ length: 32 }, (_, index) => [`key_${index}`, index]),
      ),
    );

    await service.captureEvent({
      name: 'web.feed_viewed',
      properties,
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    const row = JSON.parse(body.trim()) as { properties: string };
    const sanitizedProperties = JSON.parse(row.properties) as Record<string, unknown>;

    expect(Object.keys(sanitizedProperties)).toHaveLength(24);
    expect(sanitizedProperties.longText).toHaveLength(500);
    expect(sanitizedProperties.longText).toMatch(/\.\.\.$/);
    expect(sanitizedProperties.nested).toBe(
      '{"deep":{"payload":"kept as a string"}}',
    );
    expect(sanitizedProperties.undefinedValue).toBeUndefined();
    expect(sanitizedProperties[longKey.slice(0, 80)]).toBe('kept');
  });

  it('redacts sensitive keys and URL values from event properties before insert', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.feed_viewed',
      properties: {
        token: 'raw-token',
        currentUrl: '/details?postId=42&api_key=secret-key',
        nested: {
          password: 'hunter2',
          safe: 'kept',
        },
      },
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    const row = JSON.parse(body.trim()) as { properties: string };
    const sanitizedProperties = JSON.parse(row.properties) as Record<string, unknown>;

    expect(sanitizedProperties.token).toBe('[redacted]');
    expect(sanitizedProperties.currentUrl).toBe(
      '/details?postId=42&api_key=[redacted]',
    );
    expect(JSON.parse(sanitizedProperties.nested as string)).toEqual({
      password: '[redacted]',
      safe: 'kept',
    });
  });

  it('removes control characters from event property keys and values before insert', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn() } as any,
    );

    await service.captureEvent({
      name: 'web.feed_viewed',
      properties: {
        'bad\nkey': 'line one\nline two',
        nested: {
          'tab\tkey': 'value\twith tab',
        },
      },
    });

    const body = fetchSpy.mock.calls[0][1]?.body as string;
    const row = JSON.parse(body.trim()) as { properties: string };
    const sanitizedProperties = JSON.parse(row.properties) as Record<string, unknown>;

    expect(sanitizedProperties).toHaveProperty('badkey', 'line one line two');
    expect(JSON.parse(sanitizedProperties.nested as string)).toEqual({
      tabkey: 'value with tab',
    });
  });

  it('uses valid custom ClickHouse database identifiers', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_DATABASE: 'nearbyfeed_prod_2026',
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
    );

    await service.captureEvent({ name: 'api.request' });

    const url = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(url.searchParams.get('query')).toBe(
      'INSERT INTO nearbyfeed_prod_2026.nearbyfeed_events FORMAT JSONEachRow',
    );
  });

  it('falls back to the default ClickHouse database when the configured identifier is unsafe', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    const logger = { error: jest.fn(), warn: jest.fn() };
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_DATABASE: 'nearbyfeed_observability;DROP TABLE users',
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      logger as any,
    );

    await service.captureEvent({ name: 'api.request' });

    const url = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(url.searchParams.get('query')).toBe(
      'INSERT INTO nearbyfeed_observability.nearbyfeed_events FORMAT JSONEachRow',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Ignoring unsafe CLICKHOUSE_DATABASE value',
      ObservabilityService.name,
    );
  });

  it('aborts slow ClickHouse writes using the configured timeout', async () => {
    jest.useFakeTimers();
    const logger = { error: jest.fn(), warn: jest.fn() };
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener('abort', () => {
              reject(new Error('aborted'));
            });
          }) as Promise<Response>,
      );
    const service = new ObservabilityService(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLICKHOUSE_TIMEOUT_MS: '50',
            CLICKHOUSE_URL: 'http://localhost:8123',
            OBSERVABILITY_ENABLED: 'true',
          };
          return values[key];
        }),
      } as any,
      logger as any,
    );

    const capturePromise = service.captureEvent({ name: 'api.request' });
    await jest.advanceTimersByTimeAsync(51);
    await capturePromise;

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to capture observability event',
      expect.any(String),
      ObservabilityService.name,
    );
  });
});
