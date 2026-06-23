import { DEFAULT_TIME_WINDOW } from '@nearbyfeed/shared';
import { BadRequestException } from '@nestjs/common';
import { PostsController } from './posts.controller';

describe('PostsController', () => {
  const postsService = {
    createPost: jest.fn(),
    deletePost: jest.fn(),
    findNearbyPosts: jest.fn(),
    findPost: jest.fn(),
    updatePost: jest.fn(),
    votePost: jest.fn(),
  };
  const commentsService = {
    createComment: jest.fn(),
    deleteComment: jest.fn(),
    findChildComments: jest.fn(),
    findComment: jest.fn(),
    findComments: jest.fn(),
    voteComment: jest.fn(),
  };
  const pollService = {
    findPoll: jest.fn(),
    votePoll: jest.fn(),
  };
  const imagesService = {
    uploadImages: jest.fn(),
  };

  const createController = () =>
    new PostsController(
      postsService as any,
      commentsService as any,
      pollService as any,
      imagesService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the shared default time window for nearby post requests', async () => {
    postsService.findNearbyPosts.mockResolvedValue({ hasMore: false, posts: [] });
    const controller = createController();

    await controller.findPosts(
      {
        latitude: 37.323,
        longitude: -122.0322,
        distance: 200,
      },
      null,
    );

    expect(postsService.findNearbyPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        distance: 200,
        latitude: 37.323,
        longitude: -122.0322,
        timeWindow: DEFAULT_TIME_WINDOW,
      }),
    );
  });

  it('rejects malformed parent comment ids before creating comments', async () => {
    const controller = createController();

    await expect(
      controller.createComment(
        { content: 'local context' },
        '7',
        '42',
        'not-a-comment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(commentsService.createComment).not.toHaveBeenCalled();
  });

  it('passes parsed numeric ids when creating a reply', async () => {
    commentsService.createComment.mockResolvedValue({ id: 10 });
    const dto = { content: 'local context' };
    const controller = createController();

    await controller.createComment(dto, '7', '42', '9');

    expect(commentsService.createComment).toHaveBeenCalledWith(dto, 42, 7, 9);
  });

  it('rejects malformed poll ids before querying polls', async () => {
    const controller = createController();

    await expect(controller.findPoll('42', 'pollish', null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(pollService.findPoll).not.toHaveBeenCalled();
  });

  it('rejects unsafe route ids before querying posts', async () => {
    const controller = createController();

    await expect(
      controller.findPost('9007199254740992', null),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(postsService.findPost).not.toHaveBeenCalled();
  });

  it('rejects malformed token user ids before voting on posts', async () => {
    const controller = createController();

    await expect(
      controller.votePost('not-a-user', '42', { value: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(postsService.votePost).not.toHaveBeenCalled();
  });
});
