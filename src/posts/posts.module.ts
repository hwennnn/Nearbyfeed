import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [UsersModule, JwtModule],
  controllers: [PostsController],
  providers: [PostsService, Logger],
})
export class PostsModule {}
