import { Logger, Module } from '@nestjs/common';
import { FilterModule } from 'src/filter/filter.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [FilterModule],
  controllers: [CommentsController],
  providers: [CommentsService, Logger],
})
export class CommentsModule {}
