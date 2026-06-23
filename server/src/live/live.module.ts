import { Logger, Module } from '@nestjs/common';
import { ObservabilityModule } from 'src/observability/observability.module';
import { RedisModule } from 'src/redis/redis.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  imports: [RedisModule, ObservabilityModule],
  controllers: [LiveController],
  providers: [LiveService, Logger],
  exports: [LiveService],
})
export class LiveModule {}
