import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { strictNumberTransform } from './strict-number.transform';

export class VotePollDto {
  @Transform(strictNumberTransform)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  pollOptionId: number;
}
