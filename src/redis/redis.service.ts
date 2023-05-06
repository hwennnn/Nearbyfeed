import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    this.client.on('error', (e) => {
      this.logger.error(
        'Failed to initialise redis',
        e instanceof Error ? e.stack : undefined,
        RedisService.name,
      );

      throw new InternalServerErrorException();
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
