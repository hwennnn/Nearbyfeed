import { IsBoolean } from 'class-validator';

export class EventParticipationDto {
  @IsBoolean()
  isAttending: boolean;
}
