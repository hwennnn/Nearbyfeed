import { BadRequestException } from '@nestjs/common';
import { CommentMutateGuard } from './comment-mutate.guard';

const createContext = (params: { commentId: string; postId: string }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params,
        user: { userId: '7' },
      }),
    }),
  }) as any;

describe('CommentMutateGuard', () => {
  it('rejects malformed ids before querying comments', async () => {
    const commentsService = {
      findComment: jest.fn().mockResolvedValue(null),
    };
    const guard = new CommentMutateGuard(commentsService as any);

    await expect(
      guard.canActivate(createContext({ postId: '42', commentId: 'NaN' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(commentsService.findComment).not.toHaveBeenCalled();
  });

  it('looks up valid route ids as numbers', async () => {
    const commentsService = {
      findComment: jest.fn().mockResolvedValue({
        id: 9,
        authorId: 7,
        isActive: true,
      }),
    };
    const guard = new CommentMutateGuard(commentsService as any);

    await expect(
      guard.canActivate(createContext({ postId: '42', commentId: '9' })),
    ).resolves.toBe(true);
    expect(commentsService.findComment).toHaveBeenCalledWith(42, 9);
  });
});
