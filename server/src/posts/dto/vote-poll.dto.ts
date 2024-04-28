import { IsNumber } from 'class-validator';

export class VotePollDto {
  @IsNumber()
  pollOptionId: number;
}
