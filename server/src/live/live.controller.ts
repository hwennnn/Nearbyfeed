import { Controller, Get, Query } from '@nestjs/common';
import { LiveNearbyDto } from './dto/live-nearby.dto';
import { type LiveUpdate } from './entities/live-update.entity';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get('nearby')
  async findNearbyUpdates(
    @Query() dto: LiveNearbyDto,
  ): Promise<{ updates: LiveUpdate[] }> {
    return {
      updates: await this.liveService.findNearbyUpdates(dto),
    };
  }
}
