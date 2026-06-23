import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';

import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { getEnvFilePaths } from 'src/config/env';
import { FilterModule } from 'src/filter/filter.module';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { ImagesModule } from 'src/images/images.module';
import { LiveModule } from 'src/live/live.module';
import { MailModule } from 'src/mail/mail.module';
import { ObservabilityModule } from 'src/observability/observability.module';
import { PostsModule } from 'src/posts/posts.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { ReportsModule } from 'src/reports/reports.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: getEnvFilePaths(),
      isGlobal: true,
    }),
    RedisModule,
    MailModule,
    PostsModule,
    CloudinaryModule,
    ImagesModule,
    LiveModule,
    FilterModule,
    GeocodingModule,
    ReportsModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
