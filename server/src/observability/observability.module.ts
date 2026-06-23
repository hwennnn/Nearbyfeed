import { Logger, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';
import { RequestTelemetryInterceptor } from './request-telemetry.interceptor';

@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTelemetryInterceptor,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
