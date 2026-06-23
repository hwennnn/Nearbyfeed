import { BadRequestException } from '@nestjs/common';
import { UserMutateGuard } from './user-mutate.guard';

const createContext = (id: string, userId = '7') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { id },
        user: { userId },
      }),
    }),
  }) as any;

describe('UserMutateGuard', () => {
  it('rejects malformed user ids before querying users', async () => {
    const usersService = {
      findActiveStateById: jest.fn().mockResolvedValue(null),
    };
    const guard = new UserMutateGuard(usersService as any);

    await expect(guard.canActivate(createContext('not-a-number'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.findActiveStateById).not.toHaveBeenCalled();
  });

  it('looks up valid token user ids as numbers', async () => {
    const usersService = {
      findActiveStateById: jest.fn().mockResolvedValue({
        id: 7,
        isDeleted: false,
      }),
    };
    const guard = new UserMutateGuard(usersService as any);

    await expect(guard.canActivate(createContext('7'))).resolves.toBe(true);
    expect(usersService.findActiveStateById).toHaveBeenCalledWith(7);
  });
});
