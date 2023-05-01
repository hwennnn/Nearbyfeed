import { Logger, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService, Logger],
  exports: [RedisService],
})
export class RedisModule {}
