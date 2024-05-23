import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @Length(6, 6, {
    message: 'OTP code must be 6 characters long',
  })
  otpCode: string;
}
