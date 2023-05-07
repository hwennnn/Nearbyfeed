import { Logger, Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [],
  controllers: [CommentsController],
  providers: [CommentsService, Logger],
})
export class CommentsModule {}
