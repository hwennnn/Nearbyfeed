import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { ObservabilityService } from 'src/observability/observability.service';
import { RedisService } from 'src/redis/redis.service';
import { type LiveNearbyDto } from './dto/live-nearby.dto';
import { type LiveUpdate } from './entities/live-update.entity';
import {
  DEFAULT_DISTANCE_METERS,
  normalizeXStatusUrl,
  resolveTimeWindow as resolveSharedTimeWindow,
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';

const TINYFISH_RUN_SSE_URL = 'https://agent.tinyfish.ai/v1/automation/run-sse';
const DEFAULT_LIVE_CACHE_TTL_SECONDS = 120;
const DEFAULT_TINYFISH_TIMEOUT_MS = 20000;
const MAX_LIVE_UPDATE_COUNT = 8;
const MAX_LIVE_TITLE_LENGTH = 90;
const MAX_LIVE_SUMMARY_LENGTH = 240;
const MAX_LIVE_TAG_COUNT = 6;
const MAX_LIVE_TAG_LENGTH = 24;
const LIVE_UPDATE_OUTPUT_SCHEMA = {
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
};

@Injectable()
export class LiveService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
    @Optional()
    private readonly observabilityService?: ObservabilityService,
  ) {}

  async findNearbyUpdates(dto: LiveNearbyDto): Promise<LiveUpdate[]> {
    const startedAt = Date.now();
    const distance = this.resolveDistance(dto);
    const timeWindow = this.resolveTimeWindow(dto);
    const apiKey =
      this.configService.get<string>('TINYFISH_API_KEY') ??
      this.configService.get<string>('MINO_API_KEY');

    if (apiKey === undefined || apiKey.length === 0) {
      this.captureLiveTelemetry(dto, {
        reason: 'missing_api_key',
        status: 'skipped',
      });
      return [];
    }

    const locationLabel = this.resolveLocationLabel(dto);
    const searchUrl = this.buildXSearchUrl(locationLabel);
    const cacheKey = this.buildCacheKey(dto, locationLabel, timeWindow);
    const cachedUpdates = await this.readCachedUpdates(cacheKey);
    if (cachedUpdates !== null) {
      this.captureLiveTelemetry(dto, {
        cacheHit: true,
        durationMs: Date.now() - startedAt,
        source: 'tinyfish',
        status: 'cache_hit',
        updateCount: cachedUpdates.length,
      });
      return cachedUpdates;
    }

    try {
      const updates = await this.extractUpdatesWithMino(apiKey, searchUrl, {
        distance,
        locationLabel,
        timeWindow,
      });

      await this.cacheUpdates(cacheKey, updates);
      this.captureLiveTelemetry(dto, {
        cacheHit: false,
        durationMs: Date.now() - startedAt,
        source: 'tinyfish',
        status: 'fetched',
        updateCount: updates.length,
      });
      return updates;
    } catch (e) {
      this.logger.error(
        'Failed to fetch live nearby updates',
        e instanceof Error ? e.stack : undefined,
        LiveService.name,
      );
      this.captureLiveTelemetry(dto, {
        durationMs: Date.now() - startedAt,
        errorType: e instanceof Error ? e.name : typeof e,
        source: 'tinyfish',
        status: 'failed',
      });

      return [];
    }
  }

  private captureLiveTelemetry(
    dto: LiveNearbyDto,
    properties: Record<string, unknown>,
  ): void {
    void this.observabilityService
      ?.captureEvent({
        name: 'live.enrichment',
        properties: {
          distance: this.resolveDistance(dto),
          locationMode: this.getLocationMode(dto),
          timeWindow: this.resolveTimeWindow(dto),
          ...properties,
        },
      })
      .catch(() => undefined);
  }

  private getLocationMode(dto: LiveNearbyDto): 'coordinates' | 'named' {
    const locationName = dto.locationName?.trim();
    return locationName !== undefined && locationName.length > 0
      ? 'named'
      : 'coordinates';
  }

  private buildCacheKey(
    dto: LiveNearbyDto,
    locationLabel: string,
    timeWindow: TimeWindow,
  ): string {
    const normalizedLocation = locationLabel.trim().toLowerCase().replace(/\s+/g, ' ');
    const locationFingerprint = createHash('sha256')
      .update(normalizedLocation)
      .digest('hex')
      .slice(0, 16);

    return `live:nearby:${timeWindow}:${this.resolveDistance(
      dto,
    )}m:loc_${locationFingerprint}`;
  }

  private resolveDistance(dto: LiveNearbyDto): DistanceMeters {
    return dto.distance ?? DEFAULT_DISTANCE_METERS;
  }

  private resolveTimeWindow(dto: LiveNearbyDto): TimeWindow {
    return resolveSharedTimeWindow(dto.timeWindow);
  }

  private resolveLocationLabel(dto: LiveNearbyDto): string {
    const locationName = dto.locationName?.trim();
    if (locationName !== undefined && locationName.length > 0) {
      return locationName;
    }

    return `${dto.latitude.toFixed(4)}, ${dto.longitude.toFixed(4)}`;
  }

  private buildXSearchUrl(locationLabel: string): string {
    const query = [
      `"${locationLabel}"`,
      '(nearby OR local OR happening OR alert OR event OR queue OR music)',
      '-filter:replies',
    ].join(' ');

    return `https://x.com/search?q=${encodeURIComponent(
      query,
    )}&src=typed_query&f=live`;
  }

  private async extractUpdatesWithMino(
    apiKey: string,
    url: string,
    context: {
      distance: DistanceMeters;
      locationLabel: string;
      timeWindow: string;
    },
  ): Promise<LiveUpdate[]> {
    const timeoutMs = this.getTinyFishTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.getRunSseUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          url,
          browser_profile: 'stealth',
          goal: `Extract recent public X posts about real-time things happening within ${context.distance}m of ${context.locationLabel} inside the ${context.timeWindow} window. Return JSON exactly as {"updates":[{"title":str,"summary":str,"url":str,"source":"x","occurredAt":str|null,"tags":[str]}]}. Keep only posts that appear local, useful, and recent.`,
          output_schema: LIVE_UPDATE_OUTPUT_SCHEMA,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Mino request failed with ${response.status}`);
      }

      const body = await response.text();
      return this.parseMinoSse(body);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseMinoSse(body: string): LiveUpdate[] {
    const bodyEvent = this.parseSseEvent(body.trim());
    const bodyUpdates = this.normalizeCompleteEvent(bodyEvent);
    if (bodyUpdates !== null) {
      return bodyUpdates;
    }

    for (const line of body.split(/\r?\n/)) {
      if (!line.startsWith('data: ')) continue;

      const event = this.parseSseEvent(line.slice(6));
      const updates = this.normalizeCompleteEvent(event);
      if (updates !== null) return updates;
    }

    return [];
  }

  private normalizeCompleteEvent(
    event: Record<string, unknown> | null,
  ): LiveUpdate[] | null {
    if (
      event?.type === 'COMPLETE' &&
      event?.status === 'COMPLETED' &&
      (event?.result !== undefined || event?.resultJson !== undefined)
    ) {
      return this.normalizeUpdates(event.result ?? event.resultJson);
    }

    return null;
  }

  private getRunSseUrl(): string {
    return (
      this.configService.get<string>('TINYFISH_RUN_SSE_URL') ??
      this.configService.get<string>('MINO_RUN_SSE_URL') ??
      TINYFISH_RUN_SSE_URL
    );
  }

  private parseSseEvent(payload: string): Record<string, unknown> | null {
    try {
      const event = JSON.parse(payload);
      return event !== null && typeof event === 'object'
        ? (event as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private normalizeUpdates(resultJson: unknown): LiveUpdate[] {
    const parsedResult = this.parseJsonResult(resultJson);
    const rawUpdates =
      Array.isArray(parsedResult)
        ? parsedResult
        : Array.isArray((parsedResult as { updates?: unknown }).updates)
        ? (parsedResult as { updates: unknown[] }).updates
        : [];

    const seenUrls = new Set<string>();
    const updates: LiveUpdate[] = [];

    for (const rawUpdate of rawUpdates) {
      if (updates.length >= MAX_LIVE_UPDATE_COUNT) break;

      const update = this.normalizeUpdate(rawUpdate, updates.length);
      if (update === null || seenUrls.has(update.url)) continue;

      seenUrls.add(update.url);
      updates.push(update);
    }

    return updates;
  }

  private parseJsonResult(resultJson: unknown): unknown {
    if (typeof resultJson !== 'string') return resultJson;

    try {
      return JSON.parse(resultJson);
    } catch {
      return resultJson;
    }
  }

  private normalizeUpdate(rawUpdate: unknown, index: number): LiveUpdate | null {
    if (rawUpdate === null || typeof rawUpdate !== 'object') {
      return null;
    }

    const update = rawUpdate as Partial<LiveUpdate>;
    const title = this.sanitizeText(update.title, MAX_LIVE_TITLE_LENGTH);
    const summary = this.sanitizeText(update.summary, MAX_LIVE_SUMMARY_LENGTH);
    const url = this.normalizeXUrl(update.url);

    if (title === null || summary === null || url === null) {
      return null;
    }

    return {
      id: `x-${index}-${Buffer.from(url).toString('base64url')}`,
      title,
      summary,
      url,
      source: 'x',
      occurredAt: this.normalizeOccurredAt(update.occurredAt),
      tags: this.normalizeTags(update.tags),
    };
  }

  private normalizeXUrl(value: unknown): string | null {
    return normalizeXStatusUrl(value);
  }

  private normalizeOccurredAt(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private normalizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const tags: string[] = [];
    const seenTags = new Set<string>();

    for (const rawTag of value) {
      if (tags.length >= MAX_LIVE_TAG_COUNT) break;

      const tag = this.sanitizeText(rawTag, MAX_LIVE_TAG_LENGTH);
      if (tag === null || seenTags.has(tag)) continue;

      seenTags.add(tag);
      tags.push(tag);
    }

    return tags;
  }

  private sanitizeText(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;

    const normalized = value
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (normalized.length === 0) return null;

    return this.truncate(normalized, maxLength);
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
  }

  private async readCachedUpdates(cacheKey: string): Promise<LiveUpdate[] | null> {
    try {
      const cachedUpdates = await this.redisService.get<unknown>(cacheKey);
      return Array.isArray(cachedUpdates)
        ? this.normalizeUpdates(cachedUpdates)
        : null;
    } catch (e) {
      this.logger.warn(
        'Failed to read live updates cache',
        e instanceof Error ? e.stack : undefined,
        LiveService.name,
      );
      return null;
    }
  }

  private async cacheUpdates(
    cacheKey: string,
    updates: LiveUpdate[],
  ): Promise<void> {
    const ttlSeconds = this.getCacheTtlSeconds();
    if (ttlSeconds <= 0) return;

    try {
      await this.redisService.set(cacheKey, updates, ttlSeconds);
    } catch (e) {
      this.logger.warn(
        'Failed to write live updates cache',
        e instanceof Error ? e.stack : undefined,
        LiveService.name,
      );
    }
  }

  private getCacheTtlSeconds(): number {
    const configuredTtl = this.getNumberConfig([
      'TINYFISH_CACHE_TTL_SECONDS',
      'MINO_CACHE_TTL_SECONDS',
    ]);
    return configuredTtl !== null && configuredTtl >= 0
      ? configuredTtl
      : DEFAULT_LIVE_CACHE_TTL_SECONDS;
  }

  private getTinyFishTimeoutMs(): number {
    const configuredTimeout = this.getNumberConfig([
      'TINYFISH_TIMEOUT_MS',
      'MINO_TIMEOUT_MS',
    ]);
    return configuredTimeout !== null &&
      Number.isInteger(configuredTimeout) &&
      configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_TINYFISH_TIMEOUT_MS;
  }

  private getNumberConfig(keys: string[]): number | null {
    for (const key of keys) {
      const rawValue = this.configService.get<string>(key);
      if (rawValue === undefined || rawValue.length === 0) continue;

      const value = Number(rawValue);
      if (Number.isFinite(value)) return value;
    }

    return null;
  }
}
