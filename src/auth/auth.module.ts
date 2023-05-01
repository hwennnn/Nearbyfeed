import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtRefreshTokenStrategy } from 'src/auth/strategies/jwt-refresh-token.strategy';

import { JwtAuthStrategy } from 'src/auth/strategies/jwt-auth.strategy';
import { RedisModule } from 'src/redis/redis.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule, JwtModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService, Logger, JwtAuthStrategy, JwtRefreshTokenStrategy],
})
export class AuthModule {}
