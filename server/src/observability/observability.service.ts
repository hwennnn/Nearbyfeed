import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  isSensitiveQueryKey,
  redactUrlForLogs,
} from 'src/utils/redact-url.util';
import { type CreateObservabilityEventDto } from './dto/create-observability-event.dto';

const MAX_PROPERTY_COUNT = 24;
const MAX_PROPERTY_KEY_LENGTH = 80;
const MAX_PROPERTY_VALUE_LENGTH = 500;
const DEFAULT_CLICKHOUSE_DATABASE = 'nearbyfeed_observability';
const DEFAULT_CLICKHOUSE_TIMEOUT_MS = 2000;
const DEFAULT_MAX_CLIENT_TIMESTAMP_SKEW_MS = 24 * 60 * 60 * 1000;
const CLICKHOUSE_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

@Injectable()
export class ObservabilityService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async captureEvent(dto: CreateObservabilityEventDto): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const url = this.configService.get<string>('CLICKHOUSE_URL');
    if (url === undefined || url.length === 0) {
      return;
    }

    const database = this.resolveDatabaseName();
    const query = `INSERT INTO ${database}.nearbyfeed_events FORMAT JSONEachRow`;
    const { eventTime, properties: eventTimeProperties } =
      this.resolveEventTime(dto);
    const row = {
      event_time: this.formatDateTime64(eventTime),
      event_name: dto.name,
      session_id: dto.sessionId ?? null,
      user_id: dto.userId ?? null,
      route: this.sanitizeRoute(dto.route),
      properties: JSON.stringify(
        this.sanitizeProperties({
          ...dto.properties,
          ...eventTimeProperties,
        }),
      ),
    };

    try {
      const response = await this.fetchWithTimeout(
        `${url}/?query=${encodeURIComponent(query)}`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          body: `${JSON.stringify(row)}\n`,
        },
      );

      if (!response.ok) {
        throw new Error(`ClickHouse insert failed with ${response.status}`);
      }
    } catch (e) {
      this.logger.error(
        'Failed to capture observability event',
        e instanceof Error ? e.stack : undefined,
        ObservabilityService.name,
      );
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getClickHouseTimeoutMs(),
    );

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private formatDateTime64(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private resolveEventTime(dto: CreateObservabilityEventDto): {
    eventTime: Date;
    properties: Record<string, unknown>;
  } {
    const serverTime = new Date();
    if (dto.clientTimestamp === undefined) {
      return { eventTime: serverTime, properties: {} };
    }

    const clientTime = new Date(dto.clientTimestamp);
    if (Number.isNaN(clientTime.getTime())) {
      return {
        eventTime: serverTime,
        properties: {
          clientTimestampRejected: true,
          clientTimestampRejectReason: 'invalid',
        },
      };
    }

    const skewMs = Math.abs(clientTime.getTime() - serverTime.getTime());
    if (skewMs > this.getMaxClientTimestampSkewMs()) {
      return {
        eventTime: serverTime,
        properties: {
          clientTimestampRejected: true,
          clientTimestampSkewMs: skewMs,
        },
      };
    }

    return {
      eventTime: clientTime,
      properties: {
        clientTimestampSkewMs: skewMs,
      },
    };
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('OBSERVABILITY_ENABLED') === 'true';
  }

  private resolveDatabaseName(): string {
    const database = this.configService.get<string>('CLICKHOUSE_DATABASE');
    if (database === undefined || database.length === 0) {
      return DEFAULT_CLICKHOUSE_DATABASE;
    }

    if (CLICKHOUSE_IDENTIFIER_PATTERN.test(database)) {
      return database;
    }

    this.logger.warn(
      'Ignoring unsafe CLICKHOUSE_DATABASE value',
      ObservabilityService.name,
    );
    return DEFAULT_CLICKHOUSE_DATABASE;
  }

  private getClickHouseTimeoutMs(): number {
    const timeoutMs = Number(
      this.configService.get<string>('CLICKHOUSE_TIMEOUT_MS'),
    );

    return Number.isInteger(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_CLICKHOUSE_TIMEOUT_MS;
  }

  private getMaxClientTimestampSkewMs(): number {
    const skewMs = Number(
      this.configService.get<string>('OBSERVABILITY_MAX_CLIENT_SKEW_MS'),
    );

    return Number.isInteger(skewMs) && skewMs >= 0
      ? skewMs
      : DEFAULT_MAX_CLIENT_TIMESTAMP_SKEW_MS;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const username = this.configService.get<string>('CLICKHOUSE_USER');
    const password = this.configService.get<string>('CLICKHOUSE_PASSWORD');

    if (username !== undefined && password !== undefined) {
      headers.Authorization = `Basic ${Buffer.from(
        `${username}:${password}`,
      ).toString('base64')}`;
    }

    return headers;
  }

  private sanitizeRoute(route?: string): string | null {
    return route === undefined ? null : redactUrlForLogs(route);
  }

  private sanitizeProperties(
    properties?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (properties === undefined) return {};

    return Object.entries(properties).reduce<Record<string, unknown>>(
      (result, [key, value]) => {
        if (Object.keys(result).length >= MAX_PROPERTY_COUNT) {
          return result;
        }

        const safeValue = this.sanitizePropertyValue(key, value);
        if (safeValue === undefined) return result;

        result[key.slice(0, MAX_PROPERTY_KEY_LENGTH)] = safeValue;
        return result;
      },
      {},
    );
  }

  private sanitizePropertyValue(key: string, value: unknown): unknown {
    if (isSensitiveQueryKey(key)) return '[redacted]';
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value === 'string') {
      return this.truncate(redactUrlForLogs(value), MAX_PROPERTY_VALUE_LENGTH);
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : value.toString();
    }

    if (typeof value === 'boolean') return value;
    if (typeof value === 'bigint') return value.toString();

    try {
      return this.truncate(
        JSON.stringify(this.redactStructuredPropertyValue(value)),
        MAX_PROPERTY_VALUE_LENGTH,
      );
    } catch {
      return '[unserializable]';
    }
  }

  private redactStructuredPropertyValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactStructuredPropertyValue(item));
    }

    if (value !== null && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce<
        Record<string, unknown>
      >((result, [key, entryValue]) => {
        result[key] = isSensitiveQueryKey(key)
          ? '[redacted]'
          : this.redactStructuredPropertyValue(entryValue);
        return result;
      }, {});
    }

    if (typeof value === 'string') return redactUrlForLogs(value);
    if (typeof value === 'number') return Number.isFinite(value) ? value : value.toString();
    if (typeof value === 'bigint') return value.toString();

    return value;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
  }
}
