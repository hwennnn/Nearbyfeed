import { Module } from '@nestjs/common';
import { FilterService } from 'src/filter/filter.service';

@Module({
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
