import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { markRequestTelemetryCaptured } from 'src/observability/request-telemetry-state';
import { AllExceptionsFilter } from './all-exceptions.filter';

const makeHost = (
  request: Record<string, unknown> = {
    method: 'GET',
    originalUrl: '/posts?lat=1&token=secret-token&lng=2',
  },
): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ArgumentsHost;

describe('AllExceptionsFilter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs expected client errors as concise warnings', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const baseCatch = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation();
    const exception = new BadRequestException([
      'latitude must be a latitude string or number',
      'distance must be an integer number',
    ]);
    const host = makeHost();

    new AllExceptionsFilter().catch(exception, host);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'GET /posts?lat=1&token=[redacted]&lng=2 400: latitude must be a latitude string or number; distance must be an integer number',
      ),
    );
    expect(error).not.toHaveBeenCalled();
    expect(baseCatch).toHaveBeenCalledWith(exception, host);
  });

  it('keeps stack traces for server errors', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation();
    const exception = new InternalServerErrorException('Database unavailable');

    new AllExceptionsFilter().catch(exception, makeHost());

    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        'GET /posts?lat=1&token=[redacted]&lng=2 500: Database unavailable',
      ),
      exception.stack,
    );
  });

  it('captures request telemetry for errors thrown before interceptors run', () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation();
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const exception = new BadRequestException('postId must be a positive integer');

    new AllExceptionsFilter(
      undefined,
      observabilityService as any,
    ).catch(exception, makeHost());

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'api.request',
      route: '/posts?lat=1&token=[redacted]&lng=2',
      properties: {
        method: 'GET',
        statusCode: 400,
        error: 'postId must be a positive integer',
        handledBy: AllExceptionsFilter.name,
      },
    });
  });

  it('does not duplicate request telemetry already captured by the interceptor', () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation();
    const request = {
      method: 'GET',
      originalUrl: '/posts/not-a-number',
    };
    markRequestTelemetryCaptured(request);
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };

    new AllExceptionsFilter(
      undefined,
      observabilityService as any,
    ).catch(new BadRequestException('postId must be a positive integer'), makeHost(request));

    expect(observabilityService.captureEvent).not.toHaveBeenCalled();
  });
});
