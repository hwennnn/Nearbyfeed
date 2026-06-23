import { Logger } from '@nestjs/common';
import { type TokenUser } from 'src/auth/entities';
import { of, throwError } from 'rxjs';
import { RequestTelemetryInterceptor } from './request-telemetry.interceptor';

describe('RequestTelemetryInterceptor', () => {
  const createContext = (
    responseStatus = 200,
    user?: Partial<TokenUser>,
  ) =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          originalUrl:
            '/auth/google/callback?token=super-secret&distance=200&password=hunter2',
          headers: {
            'user-agent': 'vitest',
          },
          user,
        }),
        getResponse: () => ({
          statusCode: responseStatus,
        }),
      }),
    }) as any;

  it('captures successful request telemetry', (done) => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const logger = { log: jest.fn() };
    const interceptor = new RequestTelemetryInterceptor(
      observabilityService as any,
      logger as unknown as Logger,
    );

    interceptor
      .intercept(createContext(), { handle: () => of('ok') } as any)
      .subscribe({
        complete: () => {
          expect(logger.log).toHaveBeenCalledWith(
            expect.stringMatching(
              /^GET \/auth\/google\/callback\?token=\[redacted\]&distance=200&password=\[redacted\] 200 \d+ms$/,
            ),
            RequestTelemetryInterceptor.name,
          );
          expect(observabilityService.captureEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'api.request',
              route:
                '/auth/google/callback?token=[redacted]&distance=200&password=[redacted]',
              properties: expect.objectContaining({
                method: 'GET',
                statusCode: 200,
              }),
            }),
          );
          done();
        },
      });
  });

  it('attaches authenticated user ids to request telemetry', (done) => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new RequestTelemetryInterceptor(
      observabilityService as any,
      { log: jest.fn() } as unknown as Logger,
    );

    interceptor
      .intercept(
        createContext(200, {
          email: 'houman@example.com',
          sessionId: 'session-123',
          userId: '42',
        }),
        { handle: () => of('ok') } as any,
      )
      .subscribe({
        complete: () => {
          try {
            expect(observabilityService.captureEvent).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: 42,
              }),
            );
            done();
          } catch (error) {
            done(error);
          }
        },
      });
  });

  it('omits malformed authenticated user ids without failing request telemetry', (done) => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new RequestTelemetryInterceptor(
      observabilityService as any,
      { log: jest.fn() } as unknown as Logger,
    );

    interceptor
      .intercept(
        createContext(200, {
          email: 'houman@example.com',
          sessionId: 'session-123',
          userId: 'not-a-safe-id',
        }),
        { handle: () => of('ok') } as any,
      )
      .subscribe({
        complete: () => {
          try {
            expect(observabilityService.captureEvent).toHaveBeenCalledWith(
              expect.not.objectContaining({
                userId: expect.anything(),
              }),
            );
            done();
          } catch (error) {
            done(error);
          }
        },
      });
  });

  it('captures failed request telemetry before rethrowing', (done) => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new RequestTelemetryInterceptor(
      observabilityService as any,
      { log: jest.fn() } as unknown as Logger,
    );
    const error = Object.assign(new Error('boom'), { status: 418 });

    interceptor
      .intercept(createContext(), { handle: () => throwError(() => error) } as any)
      .subscribe({
        error: (caughtError) => {
          expect(caughtError).toBe(error);
          expect(observabilityService.captureEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              properties: expect.objectContaining({
                statusCode: 418,
              }),
            }),
          );
          done();
        },
      });
  });
});
