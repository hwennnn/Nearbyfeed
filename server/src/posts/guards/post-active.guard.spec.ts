import { BadRequestException } from '@nestjs/common';
import { PostActiveGuard } from './post-active.guard';

const createContext = (postId: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { postId },
      }),
    }),
  }) as any;

describe('PostActiveGuard', () => {
  it('rejects malformed post ids before querying posts', async () => {
    const postsService = {
      findPost: jest.fn().mockResolvedValue(null),
    };
    const guard = new PostActiveGuard(postsService as any);

    await expect(guard.canActivate(createContext('not-a-number'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(postsService.findPost).not.toHaveBeenCalled();
  });

  it('looks up valid post ids as numbers', async () => {
    const postsService = {
      findPost: jest.fn().mockResolvedValue({ id: 42, isActive: true }),
    };
    const guard = new PostActiveGuard(postsService as any);

    await expect(guard.canActivate(createContext('42'))).resolves.toBe(true);
    expect(postsService.findPost).toHaveBeenCalledWith(42);
  });
});
