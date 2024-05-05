import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FilterModule } from 'src/filter/filter.module';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { ImagesModule } from 'src/images/images.module';
import { UsersModule } from 'src/users/users.module';
import { CommentsService } from './comments.service';
import { EventService } from './event.service';
import { PollService } from './poll.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    UsersModule,
    JwtModule,
    ImagesModule,
    FilterModule,
    GeocodingModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, CommentsService, PollService, EventService, Logger],
})
export class PostsModule {}
