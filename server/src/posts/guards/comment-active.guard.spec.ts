import { BadRequestException } from '@nestjs/common';
import { CommentActiveGuard } from './comment-active.guard';

const createContext = (params: { commentId: string; postId: string }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params,
      }),
    }),
  }) as any;

describe('CommentActiveGuard', () => {
  it('rejects malformed comment ids before querying comments', async () => {
    const commentsService = {
      findComment: jest.fn().mockResolvedValue(null),
    };
    const guard = new CommentActiveGuard(commentsService as any);

    await expect(
      guard.canActivate(createContext({ postId: '42', commentId: 'nope' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(commentsService.findComment).not.toHaveBeenCalled();
  });

  it('looks up valid route ids as numbers', async () => {
    const commentsService = {
      findComment: jest.fn().mockResolvedValue({ id: 9, isActive: true }),
    };
    const guard = new CommentActiveGuard(commentsService as any);

    await expect(
      guard.canActivate(createContext({ postId: '42', commentId: '9' })),
    ).resolves.toBe(true);
    expect(commentsService.findComment).toHaveBeenCalledWith(42, 9);
  });
});
