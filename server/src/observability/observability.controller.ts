import { Body, Controller, Post } from '@nestjs/common';
import { CreateObservabilityEventDto } from './dto/create-observability-event.dto';
import { ObservabilityService } from './observability.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Post('events')
  async captureEvent(
    @Body() dto: CreateObservabilityEventDto,
  ): Promise<void> {
    await this.observabilityService.captureEvent(dto);
  }
}
