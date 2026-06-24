import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  const logger = { error: jest.fn(), log: jest.fn() };
  const filterService = { filterText: jest.fn((value: string) => value) };

  const createService = (prismaService: unknown): CommentsService =>
    new CommentsService(
      prismaService as any,
      logger as any,
      filterService as any,
    );

  const createComment = (
    id: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    id,
    content: `Comment ${id}`,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    postId: 10,
    points: 0,
    authorId: 1,
    author: {
      id: 1,
      username: 'houman',
      email: 'houman@example.com',
      image: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      isDeleted: false,
    },
    isActive: true,
    parentCommentId: null,
    repliesCount: 0,
    likes: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes comment lookup to the route post id', async () => {
    const comment = createComment(7);
    const prismaService = {
      comment: {
        findFirst: jest.fn(({ where }) =>
          Promise.resolve(where.postId === 10 ? comment : null),
        ),
      },
    };
    const service = createService(prismaService);

    const result = await service.findComment(10, 7);

    expect(result?.id).toBe(7);
    expect(prismaService.comment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 7,
          postId: 10,
        }),
      }),
    );
  });

  it('rejects replies whose parent comment is not an active top-level comment on the same post', async () => {
    const prismaService = {
      comment: {
        findUnique: jest.fn().mockResolvedValue(
          createComment(99, {
            postId: 99,
            parentCommentId: null,
          }),
        ),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      post: {
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([createComment(100)]),
    };
    const service = createService(prismaService);

    await expect(
      service.createComment({ content: 'hello there' }, 10, 1, 99),
    ).rejects.toThrow('Parent comment not found');
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('does not expose inactive replies or raw likes arrays in comment lists', async () => {
    const parent = createComment(1, {
      replies: [
        createComment(2, {
          parentCommentId: 1,
          likes: [{ id: 1, value: 1 }],
        }),
        createComment(3, {
          parentCommentId: 1,
          isActive: false,
          likes: [{ id: 2, value: 1 }],
        }),
      ],
    });
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([parent]),
      },
    };
    const service = createService(prismaService);

    const result = await service.findComments(10, {});

    const replies = result.comments[0].replies ?? [];

    expect(replies.map((reply) => reply.id)).toEqual([2]);
    expect('likes' in replies[0]).toBe(false);
    expect(replies[0].like).toEqual({ id: 1, value: 1 });
  });

  it('scopes child comment lists to the route post id', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findChildComments(10, 1, {});

    expect(prismaService.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          postId: 10,
          parentCommentId: 1,
        }),
      }),
    );
  });

  it('selects only public author fields for comment lists and replies', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findComments(10, {});

    expect(prismaService.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          author: {
            select: expect.not.objectContaining({
              password: true,
            }),
          },
          replies: expect.objectContaining({
            select: expect.objectContaining({
              author: {
                select: expect.not.objectContaining({
                  password: true,
                }),
              },
            }),
          }),
        }),
      }),
    );
  });

  it('defaults omitted comment sort to top to match mobile and web threads', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findComments(10, {});

    expect(prismaService.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          {
            points: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      }),
    );
  });

  it('rejects malformed top-level comment cursors before querying comments', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findComments(10, { cursor: 'not-a-cursor' }),
    ).rejects.toThrow('cursor must be a positive integer');
    expect(prismaService.comment.findMany).not.toHaveBeenCalled();
  });

  it('rejects unsafe child comment cursors before querying comments', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findChildComments(10, 1, { cursor: '9007199254740992' }),
    ).rejects.toThrow('cursor must be a positive safe integer');
    expect(prismaService.comment.findMany).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying a single comment', async () => {
    const prismaService = {
      comment: {
        findFirst: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(service.findComment(10, 7, 'not-a-user')).rejects.toThrow(
      'userId must be a positive integer',
    );
    expect(prismaService.comment.findFirst).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying comment lists', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findComments(10, { userId: 'not-a-user' }),
    ).rejects.toThrow('userId must be a positive integer');
    expect(prismaService.comment.findMany).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying child comment lists', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findChildComments(10, 1, { userId: 'not-a-user' }),
    ).rejects.toThrow('userId must be a positive integer');
    expect(prismaService.comment.findMany).not.toHaveBeenCalled();
  });

  it('soft deletes a comment and active replies while preserving audit history', async () => {
    const parent = createComment(7, {
      repliesCount: 2,
    });
    const post = { id: 10, commentsCount: 8 };
    const prismaService = {
      comment: {
        count: jest.fn().mockResolvedValue(3),
        delete: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(parent),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      post: {
        update: jest.fn().mockResolvedValue(post),
      },
      $transaction: jest.fn().mockResolvedValue([{ count: 3 }, post]),
    };
    const service = createService(prismaService);

    await expect(service.deleteComment(10, 7)).resolves.toBe(post);

    expect(prismaService.comment.updateMany).toHaveBeenCalledWith({
      data: {
        isActive: false,
      },
      where: {
        isActive: true,
        OR: [
          {
            id: 7,
          },
          {
            parentCommentId: 7,
          },
        ],
      },
    });
    expect(prismaService.comment.delete).not.toHaveBeenCalled();
    expect(prismaService.comment.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [
          {
            id: 7,
          },
          {
            parentCommentId: 7,
          },
        ],
      },
    });
    expect(prismaService.post.update).toHaveBeenCalledWith({
      data: {
        commentsCount: {
          increment: -3,
        },
      },
      where: {
        id: 10,
      },
    });
  });

  it('decrements post comment counts by active deleted comments, not stale reply counters', async () => {
    const parent = createComment(7, {
      repliesCount: 99,
    });
    const post = { id: 10, commentsCount: 8 };
    const prismaService = {
      comment: {
        count: jest.fn().mockResolvedValue(2),
        findFirst: jest.fn().mockResolvedValue(parent),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      post: {
        update: jest.fn().mockResolvedValue(post),
      },
      $transaction: jest.fn().mockResolvedValue([{ count: 2 }, post]),
    };
    const service = createService(prismaService);

    await expect(service.deleteComment(10, 7)).resolves.toBe(post);

    expect(prismaService.post.update).toHaveBeenCalledWith({
      data: {
        commentsCount: {
          increment: -2,
        },
      },
      where: {
        id: 10,
      },
    });
  });
});
