import {
  Catch,
  type HttpServer,
  HttpException,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ObservabilityService } from 'src/observability/observability.service';
import { hasRequestTelemetryCaptured } from 'src/observability/request-telemetry-state';
import { redactUrlForLogs } from './redact-url.util';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    applicationRef?: HttpServer,
    private readonly observabilityService?: ObservabilityService,
  ) {
    super(applicationRef);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();
    const method = request.method ?? 'UNKNOWN';
    const routePath = redactUrlForLogs(
      request.originalUrl ?? request.url ?? 'unknown route',
    );
    const route = `${method} ${routePath}`;
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const summary =
      exception instanceof HttpException
        ? this.summarizeHttpException(exception)
        : exception instanceof Error
        ? exception.message
        : String(exception);

    this.captureExceptionTelemetry(request, method, routePath, status, summary);

    if (exception instanceof HttpException) {
      const message = `${route} ${status}: ${summary}`;

      if (status >= 500) {
        this.logger.error(message, exception.stack);
      } else {
        this.logger.warn(message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${route}: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`${route}: ${String(exception)}`);
    }

    super.catch(exception, host);
  }

  private captureExceptionTelemetry(
    request: object,
    method: string,
    route: string,
    statusCode: number,
    error: string,
  ): void {
    if (
      this.observabilityService === undefined ||
      hasRequestTelemetryCaptured(request)
    ) {
      return;
    }

    void this.observabilityService.captureEvent({
      name: 'api.request',
      route,
      properties: {
        method,
        statusCode,
        error,
        handledBy: AllExceptionsFilter.name,
      },
    });
  }

  private summarizeHttpException(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (
      response !== null &&
      typeof response === 'object' &&
      'message' in response
    ) {
      const { message } = response as { message?: string | string[] };

      if (Array.isArray(message)) {
        return message.join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message;
  }
}
