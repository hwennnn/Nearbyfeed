import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { MailModule } from 'src/mail/mail.module';
import { PostsModule } from 'src/posts/posts.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

import { FilterModule } from './filter/filter.module';
import { ImagesController } from './images/images.controller';
import { ImagesModule } from './images/images.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    MailModule,
    PostsModule,
    CloudinaryModule,
    ImagesModule,
    FilterModule,
    GeocodingModule,
  ],
  controllers: [ImagesController],
})
export class AppModule {}
