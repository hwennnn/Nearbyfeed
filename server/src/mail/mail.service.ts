import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async sendVerificationEmail(
    email: string,
    username: string,
    otpCode: string,
  ): Promise<void> {
    if (this.shouldUseLocalMailFallback()) {
      this.logger.warn(
        `Local mail fallback: verification email for ${email} (${username}); otp=${otpCode}`,
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email',
        template: './verify-email',
        context: {
          username,
          otpCode,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send verification email to ' + email, error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  async sendResetPasswordEmail(
    email: string,
    username: string,
    resetId: string,
  ): Promise<void> {
    const apiURL = this.configService.get<string>('API_URL') as string;

    const resetEmailLink = `${apiURL}/auth/password/reset/` + resetId;

    if (this.shouldUseLocalMailFallback()) {
      this.logger.warn(
        `Local mail fallback: reset password email for ${email}; resetLink=${resetEmailLink}`,
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email, // list of receivers
        subject: 'Reset your password', // Subject line
        template: './reset-password',
        context: {
          username,
          resetEmailLink, // link to redirect the user to client to reset password
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to send reset email to ' + email,
        error instanceof Error ? error.stack : undefined,
        MailService.name,
      );

      throw new BadRequestException('Failed to send reset password email');
    }
  }

  private shouldUseLocalMailFallback(): boolean {
    const emailHost = this.configService.get<string>('EMAIL_HOST')?.trim();
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ??
      process.env.NODE_ENV ??
      'development';

    return (emailHost === undefined || emailHost === '') && nodeEnv !== 'production';
  }
}
