import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const createController = () => {
    const authService = {
      createPassword: jest.fn().mockResolvedValue(undefined),
      disconnectProvider: jest.fn().mockResolvedValue(undefined),
      linkGoogleProvider: jest.fn().mockResolvedValue(undefined),
      loginWithGoogle: jest.fn().mockResolvedValue({}),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn(),
    };

    return {
      authService,
      controller: new AuthController(authService as any, configService as any),
    };
  };

  it('reads the Google login bearer token from the request body', async () => {
    const { authService, controller } = createController();

    await controller.googleAuth({ token: 'google-body-token' });

    expect(authService.loginWithGoogle).toHaveBeenCalledWith(
      'google-body-token',
    );
  });

  it('reads the Google provider linking bearer token from the request body', async () => {
    const { authService, controller } = createController();

    await controller.connectProvider('42', { token: 'link-body-token' });

    expect(authService.linkGoogleProvider).toHaveBeenCalledWith(
      42,
      'link-body-token',
    );
  });

  it('rejects malformed token user ids before creating passwords', async () => {
    const { authService, controller } = createController();

    await expect(
      controller.createPassword('not-a-user', { password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(authService.createPassword).not.toHaveBeenCalled();
  });

  it('rejects malformed token user ids before updating passwords', async () => {
    const { authService, controller } = createController();

    await expect(
      controller.updatePassword('not-a-user', {
        originalPassword: 'Secret123!',
        newPassword: 'Secret456!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects malformed token user ids before disconnecting providers', async () => {
    const { authService, controller } = createController();

    await expect(
      controller.disconnectProvider('not-a-user', 'GOOGLE'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(authService.disconnectProvider).not.toHaveBeenCalled();
  });
});
