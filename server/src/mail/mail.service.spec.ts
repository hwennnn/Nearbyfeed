import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';

const makeService = ({
  emailHost = '',
  nodeEnv = 'development',
  sendMail = jest.fn(),
}: {
  emailHost?: string;
  nodeEnv?: string;
  sendMail?: jest.Mock;
} = {}) => {
  const mailer = {
    sendMail,
  } as unknown as MailerService;
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'EMAIL_HOST') return emailHost;
      if (key === 'NODE_ENV') return nodeEnv;
      if (key === 'API_URL') return 'http://localhost:3000';
      return undefined;
    }),
  } as unknown as ConfigService;
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  return {
    logger,
    mailer,
    service: new MailService(mailer, config, logger),
  };
};

describe('MailService', () => {
  it('logs verification OTP and skips SMTP in local development without an email host', async () => {
    const sendMail = jest.fn();
    const { logger, service } = makeService({ sendMail });

    await service.sendVerificationEmail('houman@example.com', 'houman', '123456');

    expect(sendMail).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('houman@example.com'),
    );
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('123456'));
  });

  it('throws when production verification email delivery fails', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP offline'));
    const { service } = makeService({
      emailHost: 'smtp.example.com',
      nodeEnv: 'production',
      sendMail,
    });

    await expect(
      service.sendVerificationEmail('houman@example.com', 'houman', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
