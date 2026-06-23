import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserActiveGuard } from './user-active.guard';

const createContext = (userId = '7') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId },
      }),
    }),
  }) as any;

describe('UserActiveGuard', () => {
  it('rejects malformed token user ids before querying users', async () => {
    const usersService = {
      findActiveStateById: jest.fn().mockResolvedValue(null),
    };
    const guard = new UserActiveGuard(usersService as any);

    await expect(guard.canActivate(createContext('nope'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.findActiveStateById).not.toHaveBeenCalled();
  });

  it('uses the lightweight active-state lookup for valid token users', async () => {
    const usersService = {
      findActiveStateById: jest.fn().mockResolvedValue({ id: 7, isDeleted: false }),
    };
    const guard = new UserActiveGuard(usersService as any);

    await expect(guard.canActivate(createContext('7'))).resolves.toBe(true);
    expect(usersService.findActiveStateById).toHaveBeenCalledWith(7);
  });

  it('rejects deleted token users', async () => {
    const usersService = {
      findActiveStateById: jest.fn().mockResolvedValue({ id: 7, isDeleted: true }),
    };
    const guard = new UserActiveGuard(usersService as any);

    await expect(guard.canActivate(createContext('7'))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
