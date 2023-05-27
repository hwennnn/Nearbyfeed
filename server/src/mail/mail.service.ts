import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly logger: Logger,
  ) {}

  async sendVerificationEmail(
    email: string,
    username: string,
    verificationId: string,
  ): Promise<void> {
    const verifyEmailLink =
      'http://localhost:3000/auth/verify-email/' + verificationId;

    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Verify Your Email',
        template: './verify-email',
        context: {
          username,
          verifyEmailLink,
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
    const resetEmailLink =
      'http://localhost:3000/auth/reset-password/' + resetId;

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
