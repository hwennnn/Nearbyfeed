import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly logger: Logger,
  ) {}

  async sendResetPasswordEmail(email: string, username: string): Promise<void> {
    await this.mailerService
      .sendMail({
        to: email, // list of receivers
        subject: 'Reset your password', // Subject line
        template: './reset-password',
        context: {
          username,
          resetEmailLink: 'http://localhost:3000/reset-email',
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
        throw e;
      });
  }
}
