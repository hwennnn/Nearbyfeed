import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(500)
  content: string;
}
