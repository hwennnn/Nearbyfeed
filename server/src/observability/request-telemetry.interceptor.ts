import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type TokenUser } from 'src/auth/entities';
import { type Request, type Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';
import { redactUrlForLogs } from 'src/utils/redact-url.util';
import { ObservabilityService } from './observability.service';
import { markRequestTelemetryCaptured } from './request-telemetry-state';

type RequestWithUser = Request & {
  user?: Partial<TokenUser>;
};

@Injectable()
export class RequestTelemetryInterceptor implements NestInterceptor {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        void this.captureRequest(request, response.statusCode, startedAt);
      }),
      catchError((error: unknown) => {
        const statusCode =
          typeof (error as { status?: unknown }).status === 'number'
            ? ((error as { status: number }).status)
            : response.statusCode >= 400
            ? response.statusCode
            : 500;

        void this.captureRequest(request, statusCode, startedAt);

        return throwError(() => error);
      }),
    );
  }

  private async captureRequest(
    request: Request,
    statusCode: number,
    startedAt: number,
  ): Promise<void> {
    markRequestTelemetryCaptured(request);

    const durationMs = Date.now() - startedAt;
    const route = redactUrlForLogs(request.originalUrl ?? request.url);

    this.logger.log(
      `${request.method} ${route} ${statusCode} ${durationMs}ms`,
      RequestTelemetryInterceptor.name,
    );

    await this.observabilityService.captureEvent({
      name: 'api.request',
      route,
      userId: this.resolveUserId(request.user),
      properties: {
        method: request.method,
        statusCode,
        durationMs,
        userAgent: request.headers['user-agent'] ?? null,
      },
    });
  }

  private resolveUserId(user?: Partial<TokenUser>): number | undefined {
    if (user?.userId === undefined || !/^[1-9]\d*$/.test(user.userId)) {
      return undefined;
    }

    const userId = Number(user.userId);
    return Number.isSafeInteger(userId) ? userId : undefined;
  }
}
