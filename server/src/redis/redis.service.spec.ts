import Redis from 'ioredis';
import { RedisService } from './redis.service';

const mockRedisClient = {
  del: jest.fn(),
  get: jest.fn(),
  on: jest.fn(),
  set: jest.fn(),
};

jest.mock('ioredis', () => jest.fn(() => mockRedisClient));

describe('RedisService', () => {
  const logger = { error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes redis port and empty password config', () => {
    new RedisService(
      {
        get: jest.fn((key: string) => {
          if (key === 'REDIS_HOST') return '127.0.0.1';
          if (key === 'REDIS_PORT') return '6379';
          if (key === 'REDIS_PASSWORD') return '';
          return undefined;
        }),
      } as any,
      logger as any,
    );

    expect(Redis).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '127.0.0.1',
        password: undefined,
        port: 6379,
      }),
    );
  });

  it('logs redis connection errors without throwing from the event handler', () => {
    let errorHandler: ((error: Error) => void) | undefined;
    mockRedisClient.on.mockImplementation((event, handler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });

    new RedisService(
      {
        get: jest.fn(() => undefined),
      } as any,
      logger as any,
    );

    expect(() => errorHandler?.(new Error('boom'))).not.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to initialise redis',
      expect.any(String),
      RedisService.name,
    );
  });

  it('throttles repeated redis connection error logs', () => {
    let errorHandler: ((error: Error) => void) | undefined;
    mockRedisClient.on.mockImplementation((event, handler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });

    new RedisService(
      {
        get: jest.fn(() => undefined),
      } as any,
      logger as any,
    );

    errorHandler?.(new Error('first'));
    errorHandler?.(new Error('second'));

    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
