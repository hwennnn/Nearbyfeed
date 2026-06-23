import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

const validateDto = async (body: Record<string, unknown>) =>
  await validate(plainToInstance(ResetPasswordDto, body));

describe('ResetPasswordDto', () => {
  it('accepts UUID reset tokens and strong passwords', async () => {
    await expect(
      validateDto({
        newPassword: 'NewSecret123!',
        token: '123e4567-e89b-42d3-a456-426614174000',
      }),
    ).resolves.toHaveLength(0);
  });

  it('rejects malformed reset tokens', async () => {
    const errors = await validateDto({
      newPassword: 'NewSecret123!',
      token: '../reset-password-token',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('token');
  });
});
