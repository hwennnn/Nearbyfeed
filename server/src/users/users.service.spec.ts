import { UsersService } from './users.service';

describe('UsersService', () => {
  const logger = { error: jest.fn(), log: jest.fn() };

  const createService = (prismaService: unknown): UsersService =>
    new UsersService(prismaService as any, logger as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects only public author fields for own posts', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findOwnPosts(42, {});

    expect(prismaService.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          author: {
            select: expect.not.objectContaining({
              password: true,
            }),
          },
        }),
      }),
    );
  });

  it('selects only active-state fields for guard lookups', async () => {
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 42,
          isDeleted: false,
        }),
      },
    };
    const service = createService(prismaService);

    await expect(service.findActiveStateById(42)).resolves.toEqual({
      id: 42,
      isDeleted: false,
    });

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: {
        id: true,
        isDeleted: true,
      },
    });
  });

  it('rejects malformed own-post cursors before querying posts', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findOwnPosts(42, { cursor: 'not-a-cursor' }),
    ).rejects.toThrow('cursor must be a positive integer');
    expect(prismaService.post.findMany).not.toHaveBeenCalled();
  });

  it('rejects unsafe own-comment cursors before querying comments', async () => {
    const prismaService = {
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findOwnComments(42, { cursor: '9007199254740992' }),
    ).rejects.toThrow('cursor must be a positive safe integer');
    expect(prismaService.comment.findMany).not.toHaveBeenCalled();
  });

  it('returns both blocked and blocker ids for feed exclusion', async () => {
    const prismaService = {
      blockedUser: {
        findMany: jest.fn().mockResolvedValue([
          { blockerId: 42, blockedId: 7 },
          { blockerId: 9, blockedId: 42 },
          { blockerId: 42, blockedId: 7 },
        ]),
      },
    };
    const service = createService(prismaService);

    await expect(service.findBlockedUserIds(42)).resolves.toEqual([7, 9]);

    expect(prismaService.blockedUser.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ blockerId: 42 }, { blockedId: 42 }],
      },
      select: {
        blockedId: true,
        blockerId: true,
      },
    });
  });
});
