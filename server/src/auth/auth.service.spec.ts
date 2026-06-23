import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { compareHash } from 'src/utils';

jest.mock('src/utils', () => ({
  ...jest.requireActual('src/utils'),
  compareHash: jest.fn(),
}));

describe('AuthService', () => {
  const logger = { error: jest.fn(), log: jest.fn() };
  const jwtService = { signAsync: jest.fn() };
  const configService = { get: jest.fn() };
  const redisService = {
    delete: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };
  const mailService = {
    sendResetPasswordEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const createService = ({
    redisService,
    usersService,
  }: {
    redisService: unknown;
    usersService: unknown;
  }): AuthService =>
    new AuthService(
      usersService as any,
      logger as any,
      jwtService as any,
      configService as any,
      redisService as any,
      mailService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (compareHash as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('revokes the refresh session and returns an auth failure when the token user no longer exists', async () => {
    const redisService = {
      get: jest.fn().mockResolvedValue('stored-refresh-token-hash'),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const usersService = {
      findOneById: jest.fn().mockResolvedValue(null),
    };
    const service = createService({ redisService, usersService });

    await expect(
      service.refreshTokens('presented-refresh-token', {
        email: 'deleted@example.com',
        sessionId: 'session-1',
        sub: '123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(redisService.delete).toHaveBeenCalledWith('session-1');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('revokes the refresh session when the token subject is not a valid user id', async () => {
    const redisService = {
      get: jest.fn().mockResolvedValue('stored-refresh-token-hash'),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const usersService = {
      findOneById: jest.fn(),
    };
    const service = createService({ redisService, usersService });

    await expect(
      service.refreshTokens('presented-refresh-token', {
        email: 'bad@example.com',
        sessionId: 'session-2',
        sub: 'not-a-number',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(usersService.findOneById).not.toHaveBeenCalled();
    expect(redisService.delete).toHaveBeenCalledWith('session-2');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('does not upsert a user when Google rejects the bearer token', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({ error: 'invalid_token' }),
      ok: false,
      status: 401,
    } as any);
    const usersService = {
      upsertUser: jest.fn(),
    };
    const service = createService({ redisService, usersService });

    await expect(service.loginWithGoogle('bad-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(usersService.upsertUser).not.toHaveBeenCalled();
  });

  it('does not upsert a user when Google returns an unusable profile', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({ id: 'google-user-id' }),
      ok: true,
      status: 200,
    } as any);
    const usersService = {
      upsertUser: jest.fn(),
    };
    const service = createService({ redisService, usersService });

    await expect(service.loginWithGoogle('bad-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(usersService.upsertUser).not.toHaveBeenCalled();
  });

  it('rejects malformed reset-password tokens before checking Redis', async () => {
    const redisService = {
      get: jest.fn(),
    };
    const usersService = {
      findOneByEmail: jest.fn(),
    };
    const service = createService({ redisService, usersService });

    await expect(
      service.checkResetPasswordToken('not-a-reset-token'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(redisService.get).not.toHaveBeenCalled();
    expect(usersService.findOneByEmail).not.toHaveBeenCalled();
  });

  it('rejects malformed reset-password submissions before checking Redis', async () => {
    const redisService = {
      get: jest.fn(),
    };
    const usersService = {
      findOneByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };
    const service = createService({ redisService, usersService });

    await expect(
      service.resetPassword({
        newPassword: 'NewSecret123!',
        token: '../reset-password-token',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(redisService.get).not.toHaveBeenCalled();
    expect(usersService.updatePassword).not.toHaveBeenCalled();
  });
});
