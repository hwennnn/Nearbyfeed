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
    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Verify Your Email',
        template: './verify-email',
        context: {
          username,
          otpCode,
        },
      })
      .catch((error) => {
        this.logger.error(
          'Failed to send verification email to ' + email,
          error,
        );
        throw new BadRequestException('Failed to send verification email');
      });
  }

  async sendResetPasswordEmail(
    email: string,
    username: string,
    resetId: string,
  ): Promise<void> {
    const apiURL = this.configService.get<string>('API_URL') as string;

    const resetEmailLink = `${apiURL}/auth/password/reset/` + resetId;

    await this.mailerService
      .sendMail({
        to: email, // list of receivers
        subject: 'Reset your password', // Subject line
        template: './reset-password',
        context: {
          username,
          resetEmailLink, // link to redirect the user to client to reset password
        },
      })
      .then(() => {
        console.log('done sending reset email to ' + email);
      })
      .catch((e) => {
        this.logger.error(
          'Failed to send reset email to ' + email,
          e instanceof Error ? e.stack : undefined,
          MailService.name,
        );

        throw new BadRequestException('Failed to send reset password email');
      });
  }
}
