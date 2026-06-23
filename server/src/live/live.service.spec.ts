import { LiveService } from './live.service';

describe('LiveService', () => {
  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const observabilityService = {
    captureEvent: jest.fn(),
  };
  const expectLiveCacheKey = (
    cacheKey: string,
    {
      distance,
      timeWindow,
    }: {
      distance: number;
      timeWindow: string;
    },
  ): string => {
    expect(cacheKey).toMatch(
      new RegExp(`^live:nearby:${timeWindow}:${distance}m:loc_[a-f0-9]{16}$`),
    );
    return cacheKey;
  };

  beforeEach(() => {
    redisService.get.mockReset();
    redisService.set.mockReset();
    observabilityService.captureEvent.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns no live updates when TinyFish/Mino is not configured', async () => {
    const service = new LiveService(
      {
        get: jest.fn().mockReturnValue(undefined),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 1,
        longitude: 103,
        locationName: 'Tiong Bahru',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([]);
  });

  it('captures a safe skipped telemetry event when TinyFish is not configured', async () => {
    const service = new LiveService(
      {
        get: jest.fn().mockReturnValue(undefined),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
      observabilityService as any,
    );

    await service.findNearbyUpdates({
      latitude: 1,
      longitude: 103,
      locationName: 'Tiong Bahru',
      timeWindow: '24h',
    });

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        locationMode: 'named',
        reason: 'missing_api_key',
        status: 'skipped',
        timeWindow: '24h',
      }),
    });
    expect(
      observabilityService.captureEvent.mock.calls[0][0].properties,
    ).not.toHaveProperty('locationName');
  });

  it('ignores noisy SSE frames and returns completed live updates', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        [
          'data: {not-json}',
          'data: {"type":"HEARTBEAT"}',
          'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[{"title":"Block party forming","summary":"People are gathering outside the cafe.","url":"https://x.com/example/status/1","source":"x","occurredAt":"2026-06-23T07:00:00.000Z","tags":["event"]}]}}',
        ].join('\n'),
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'MINO_API_KEY') return 'mino-key';
          if (key === 'MINO_TIMEOUT_MS') return '1000';
          if (key === 'MINO_CACHE_TTL_SECONDS') return '300';
          return undefined;
        }),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 37.323,
        longitude: -122.0322,
        locationName: 'Cupertino',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        source: 'x',
        title: 'Block party forming',
        url: 'https://x.com/example/status/1',
      }),
    ]);
  });

  it('uses the documented TinyFish Agent SSE endpoint with a typed output schema', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'MINO_TIMEOUT_MS') return '1000';
          if (key === 'MINO_CACHE_TTL_SECONDS') return '0';
          return undefined;
        }),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: 'Cupertino',
      timeWindow: '24h',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://agent.tinyfish.ai/v1/automation/run-sse',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'tinyfish-key',
        }),
      }),
    );
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      output_schema?: unknown;
    };
    expect(body.output_schema).toEqual({
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              url: { type: 'string' },
              source: { const: 'x' },
              occurredAt: { type: ['string', 'null'] },
              tags: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['title', 'summary', 'url'],
          },
        },
      },
      required: ['updates'],
    });
  });

  it('keeps live enrichment scoped to the requested radius', async () => {
    redisService.get.mockResolvedValueOnce(null);
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '300';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
      observabilityService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      distance: 500,
      locationName: 'Cupertino',
      timeWindow: '2h',
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      goal: string;
    };

    expect(body.goal).toContain('within 500m of Cupertino');
    const cacheKey = expectLiveCacheKey(redisService.get.mock.calls[0][0], {
      distance: 500,
      timeWindow: '2h',
    });
    expect(redisService.set).toHaveBeenCalledWith(
      cacheKey,
      [],
      300,
    );
    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        distance: 500,
        status: 'fetched',
        timeWindow: '2h',
      }),
    });
  });

  it('keeps live enrichment cache keys bounded and free of raw location text', async () => {
    redisService.get.mockResolvedValueOnce(null);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '300';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      distance: 500,
      locationName: 'Cupertino Car Wash, 10002, North De Anza Boulevard',
      timeWindow: '2h',
    });

    const [cacheKey] = redisService.get.mock.calls[0] as [string];

    expectLiveCacheKey(cacheKey, { distance: 500, timeWindow: '2h' });
    expect(cacheKey).not.toContain('cupertino');
    expect(cacheKey.length).toBeLessThanOrEqual(42);
    expect(redisService.set).toHaveBeenCalledWith(cacheKey, [], 300);
  });

  it('defaults service-level live enrichment requests to the shared time window', async () => {
    redisService.get.mockResolvedValueOnce(null);
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '300';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
      observabilityService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: 'Cupertino',
    } as any);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      goal: string;
    };

    expect(body.goal).toContain('inside the 24h window');
    const cacheKey = expectLiveCacheKey(redisService.get.mock.calls[0][0], {
      distance: 200,
      timeWindow: '24h',
    });
    expect(redisService.set).toHaveBeenCalledWith(
      cacheKey,
      [],
      300,
    );
    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        status: 'fetched',
        timeWindow: '24h',
      }),
    });
  });

  it('uses TinyFish-branded timeout and cache ttl env vars', async () => {
    jest.useFakeTimers();
    const logger = { error: jest.fn(), warn: jest.fn() };
    jest
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
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '25';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '450';
          return undefined;
        }),
      } as any,
      logger as any,
      redisService as any,
    );

    const updatesPromise = service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: 'Cupertino',
      timeWindow: '24h',
    });
    await jest.advanceTimersByTimeAsync(26);

    await expect(updatesPromise).resolves.toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to fetch live nearby updates',
      expect.any(String),
      LiveService.name,
    );
  });

  it('uses TinyFish-branded cache ttl when caching extracted updates', async () => {
    redisService.get.mockResolvedValueOnce(null);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[{"title":"Night market line","summary":"People are queueing nearby.","url":"https://x.com/example/status/ttl","source":"x","occurredAt":null,"tags":[]}]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '450';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 37.323,
        longitude: -122.0322,
        locationName: 'Cupertino',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ title: 'Night market line' }),
    ]);

    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^live:nearby:24h:200m:loc_[a-f0-9]{16}$/),
      [expect.objectContaining({ title: 'Night market line' })],
      450,
    );
  });

  it('falls back to coordinates when the location name is blank', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '0';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: '   ',
      timeWindow: '24h',
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      url: string;
    };
    expect(decodeURIComponent(body.url)).toContain('"37.3230, -122.0322"');
  });

  it('reuses cached nearby updates for equivalent live lookups', async () => {
    redisService.get.mockResolvedValueOnce(null).mockResolvedValueOnce([
      {
        id: 'cached-update',
        title: 'Cached block party',
        summary: 'Already fetched.',
        url: 'https://x.com/example/status/cached',
        source: 'x',
        occurredAt: null,
        tags: [],
      },
    ]);
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","resultJson":{"updates":[{"title":"Fresh block party","summary":"People are gathering outside the cafe.","url":"https://x.com/example/status/1","source":"x","occurredAt":null,"tags":[]}]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'MINO_API_KEY') return 'mino-key';
          if (key === 'MINO_TIMEOUT_MS') return '1000';
          if (key === 'MINO_CACHE_TTL_SECONDS') return '120';
          return undefined;
        }),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
    );
    const dto = {
      latitude: 37.323,
      longitude: -122.0322,
      locationName: ' Cupertino ',
      timeWindow: '24h' as const,
    };

    await expect(service.findNearbyUpdates(dto)).resolves.toEqual([
      expect.objectContaining({ title: 'Fresh block party' }),
    ]);
    await expect(
      service.findNearbyUpdates({
        ...dto,
        locationName: 'cupertino',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ title: 'Cached block party' }),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const firstCacheKey = expectLiveCacheKey(redisService.get.mock.calls[0][0], {
      distance: 200,
      timeWindow: '24h',
    });
    expect(redisService.get).toHaveBeenCalledWith(firstCacheKey);
    expect(redisService.set).toHaveBeenCalledWith(
      firstCacheKey,
      [expect.objectContaining({ title: 'Fresh block party' })],
      120,
    );
  });

  it('captures cache hit telemetry without raw location text', async () => {
    redisService.get.mockResolvedValueOnce([
      {
        id: 'cached-update',
        title: 'Cached block party',
        summary: 'Already fetched.',
        url: 'https://x.com/example/status/cached',
        source: 'x',
        occurredAt: null,
        tags: [],
      },
    ]);
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
      observabilityService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 37.323,
        longitude: -122.0322,
        locationName: 'Cupertino',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ title: 'Cached block party' }),
    ]);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        cacheHit: true,
        locationMode: 'named',
        source: 'tinyfish',
        status: 'cache_hit',
        timeWindow: '24h',
        updateCount: 1,
      }),
    });
    expect(
      observabilityService.captureEvent.mock.calls[0][0].properties,
    ).not.toHaveProperty('locationName');
  });

  it('still accepts legacy Mino resultJson SSE frames', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","resultJson":{"updates":[{"title":"Legacy nearby alert","summary":"Old result shape still works.","url":"https://x.com/example/status/legacy","source":"x","occurredAt":null,"tags":[]}]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'MINO_API_KEY') return 'mino-key';
          if (key === 'MINO_TIMEOUT_MS') return '1000';
          if (key === 'MINO_CACHE_TTL_SECONDS') return '0';
          return undefined;
        }),
      } as any,
      { error: jest.fn() } as any,
      redisService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 37.323,
        longitude: -122.0322,
        locationName: 'Cupertino',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ title: 'Legacy nearby alert' }),
    ]);
  });

  it('captures fetched telemetry for successful live enrichment', async () => {
    redisService.get.mockResolvedValueOnce(null);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        'data: {"type":"COMPLETE","status":"COMPLETED","result":{"updates":[{"title":"Night market line","summary":"People are queueing nearby.","url":"https://x.com/example/status/fetched","source":"x","occurredAt":null,"tags":[]}]}}',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '120';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
      observabilityService as any,
    );

    await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: undefined,
      timeWindow: '2h',
    });

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        cacheHit: false,
        durationMs: expect.any(Number),
        locationMode: 'coordinates',
        source: 'tinyfish',
        status: 'fetched',
        timeWindow: '2h',
        updateCount: 1,
      }),
    });
  });

  it('captures failed telemetry when live enrichment throws', async () => {
    redisService.get.mockResolvedValueOnce(null);
    const logger = { error: jest.fn(), warn: jest.fn() };
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '',
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '120';
          return undefined;
        }),
      } as any,
      logger as any,
      redisService as any,
      observabilityService as any,
    );

    await expect(
      service.findNearbyUpdates({
        latitude: 37.323,
        longitude: -122.0322,
        locationName: 'Cupertino',
        timeWindow: '24h',
      }),
    ).resolves.toEqual([]);

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'live.enrichment',
      properties: expect.objectContaining({
        durationMs: expect.any(Number),
        errorType: 'Error',
        locationMode: 'named',
        source: 'tinyfish',
        status: 'failed',
        timeWindow: '24h',
      }),
    });
  });

  it('filters unsafe live enrichment URLs and bounds returned text', async () => {
    redisService.get.mockResolvedValueOnce(null);
    const longTitle = `  ${'A'.repeat(140)}  `;
    const longSummary = ` ${'B'.repeat(320)} `;
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          type: 'COMPLETE',
          status: 'COMPLETED',
          result: {
            updates: [
              {
                title: longTitle,
                summary: longSummary,
                url: 'https://x.com/example/status/safe',
                source: 'x',
                occurredAt: 'not-a-date',
                tags: [
                  ' music ',
                  'nearby',
                  'x'.repeat(60),
                  42,
                  'queue',
                  'food',
                  'late-night',
                  'extra-tag',
                ],
              },
              {
                title: 'Bad scheme',
                summary: 'Should never show up.',
                url: 'javascript:alert(1)',
              },
              {
                title: 'Wrong domain',
                summary: 'Should never show up.',
                url: 'https://example.com/not-x',
              },
              {
                title: 'Plain HTTP',
                summary: 'Should never show up.',
                url: 'http://x.com/example/status/insecure',
              },
            ],
          },
        }),
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '120';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
    );

    const updates = await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: 'Cupertino',
      timeWindow: '24h',
    });

    expect(updates).toEqual([
      expect.objectContaining({
        occurredAt: null,
        source: 'x',
        url: 'https://x.com/example/status/safe',
      }),
    ]);
    expect(updates[0].title).toHaveLength(90);
    expect(updates[0].title).toMatch(/\.\.\.$/);
    expect(updates[0].summary).toHaveLength(240);
    expect(updates[0].summary).toMatch(/\.\.\.$/);
    expect(updates[0].tags).toEqual([
      'music',
      'nearby',
      `${'x'.repeat(21)}...`,
      'queue',
      'food',
      'late-night',
    ]);
    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^live:nearby:24h:200m:loc_[a-f0-9]{16}$/),
      updates,
      120,
    );
  });

  it('deduplicates and caps live enrichment updates before caching', async () => {
    redisService.get.mockResolvedValueOnce(null);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        `data: ${JSON.stringify({
          type: 'COMPLETE',
          status: 'COMPLETED',
          result: {
            updates: [
              {
                title: 'Duplicate line',
                summary: 'First one wins.',
                url: 'https://x.com/example/status/dup',
              },
              {
                title: 'Duplicate line again',
                summary: 'Should be dropped.',
                url: 'https://x.com/example/status/dup',
              },
              ...Array.from({ length: 12 }, (_, index) => ({
                title: `Signal ${index}`,
                summary: `Useful local signal ${index}`,
                url: `https://twitter.com/example/status/${index}`,
              })),
            ],
          },
        })}`,
    } as Response);
    const service = new LiveService(
      {
        get: jest.fn((key: string) => {
          if (key === 'TINYFISH_API_KEY') return 'tinyfish-key';
          if (key === 'TINYFISH_TIMEOUT_MS') return '1000';
          if (key === 'TINYFISH_CACHE_TTL_SECONDS') return '120';
          return undefined;
        }),
      } as any,
      { error: jest.fn(), warn: jest.fn() } as any,
      redisService as any,
    );

    const updates = await service.findNearbyUpdates({
      latitude: 37.323,
      longitude: -122.0322,
      locationName: 'Cupertino',
      timeWindow: '24h',
    });

    expect(updates).toHaveLength(8);
    expect(updates.map((update) => update.url)).toEqual([
      'https://x.com/example/status/dup',
      'https://twitter.com/example/status/0',
      'https://twitter.com/example/status/1',
      'https://twitter.com/example/status/2',
      'https://twitter.com/example/status/3',
      'https://twitter.com/example/status/4',
      'https://twitter.com/example/status/5',
      'https://twitter.com/example/status/6',
    ]);
    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^live:nearby:24h:200m:loc_[a-f0-9]{16}$/),
      updates,
      120,
    );
  });
});
