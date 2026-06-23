import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CreateObservabilityEventDto } from './dto/create-observability-event.dto';
import { ObservabilityService } from './observability.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Post('events')
  async captureEvent(
    @Body() dto: CreateObservabilityEventDto,
  ): Promise<void> {
    if (!dto.name.startsWith('web.')) {
      throw new BadRequestException(
        'Only web telemetry events can be captured publicly',
      );
    }

    const { userId: _clientSuppliedUserId, ...clientEvent } = dto;

    await this.observabilityService.captureEvent(clientEvent);
  }
}
