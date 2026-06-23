import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;
  private lastConnectionErrorLogAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    const configuredPassword =
      this.configService.get<string>('REDIS_PASSWORD') ??
      this.configService.get<string>('REDIS_PASSOWRD');
    const password =
      configuredPassword !== undefined && configuredPassword.trim().length > 0
        ? configuredPassword
        : undefined;
    const configuredPort = Number(this.configService.get<string>('REDIS_PORT'));

    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: Number.isFinite(configuredPort) ? configuredPort : 6379,
      password,
      retryStrategy: (times) => Math.min(times * 100, 2000),
    });

    this.client.on('error', (e) => {
      const now = Date.now();
      if (now - this.lastConnectionErrorLogAt < 30000) {
        return;
      }
      this.lastConnectionErrorLogAt = now;

      this.logger.error(
        'Failed to initialise redis',
        e instanceof Error ? e.stack : undefined,
        RedisService.name,
      );
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttl !== undefined) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const serializedValue = await this.client.get(key);

    if (serializedValue === null) {
      return null;
    }

    return JSON.parse(serializedValue) as T;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
