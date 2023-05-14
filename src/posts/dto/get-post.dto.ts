import {
  IsLatitude,
  IsLongitude,
  IsNumberString,
  Validate,
} from 'class-validator';
import { ValidDistanceRangeValue } from 'src/posts/decorators';

export class GetPostDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumberString()
  @Validate(ValidDistanceRangeValue)
  distance: number;

  userId?: string;
}
