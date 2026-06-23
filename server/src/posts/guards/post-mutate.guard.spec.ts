import { BadRequestException } from '@nestjs/common';
import { PostMutateGuard } from './post-mutate.guard';

const createContext = (postId: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { postId },
        user: { userId: '7' },
      }),
    }),
  }) as any;

describe('PostMutateGuard', () => {
  it('rejects malformed post ids before querying posts', async () => {
    const postsService = {
      findPost: jest.fn().mockResolvedValue(null),
    };
    const guard = new PostMutateGuard(postsService as any);

    await expect(guard.canActivate(createContext('NaN'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(postsService.findPost).not.toHaveBeenCalled();
  });

  it('looks up valid post ids as numbers', async () => {
    const postsService = {
      findPost: jest.fn().mockResolvedValue({
        id: 42,
        authorId: 7,
        isActive: true,
      }),
    };
    const guard = new PostMutateGuard(postsService as any);

    await expect(guard.canActivate(createContext('42'))).resolves.toBe(true);
    expect(postsService.findPost).toHaveBeenCalledWith(42);
  });
});
