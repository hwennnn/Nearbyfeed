import { PostsService } from './posts.service';

describe('PostsService', () => {
  const logger = { error: jest.fn(), log: jest.fn() };
  const filterService = { filterText: jest.fn((value: string) => value) };
  const geocodingService = { getLocationName: jest.fn() };
  const usersService = {
    findBlockedUsersIds: jest.fn().mockResolvedValue([]),
  };

  const createService = (prismaService: unknown): PostsService =>
    new PostsService(
      prismaService as any,
      logger as any,
      filterService as any,
      geocodingService as any,
      usersService as any,
    );

  const createPost = (id: number, latitude: number, longitude: number) => ({
    id,
    title: `Post ${id}`,
    content: null,
    latitude,
    longitude,
    locationName: 'Nearby',
    fullLocationName: 'Nearby, Earth',
    images: [],
    points: 0,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    authorId: 1,
    isActive: true,
    isEdited: false,
    commentsCount: 0,
    likes: [],
    author: {
      id: 1,
      username: 'houman',
      email: 'houman@example.com',
      image: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      isDeleted: false,
    },
    poll: null,
    location: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters bounding-box candidates to the actual requested radius', async () => {
    const prismaService = {
      post: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            createPost(1, 0.0005, 0),
            createPost(2, 0.0017, 0.0017),
          ]),
      },
    };
    const service = createService(prismaService);

    const result = await service.findNearbyPosts({
      latitude: 0,
      longitude: 0,
      distance: 200,
    });

    expect(result.posts.map((post) => post.id)).toEqual([1]);
    expect(result.hasMore).toBe(false);
  });

  it('passes time-window filters to the nearby posts query', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-02-01T12:00:00.000Z'));
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findNearbyPosts({
      latitude: 0,
      longitude: 0,
      distance: 200,
      timeWindow: '24h',
    });

    expect(prismaService.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2024-01-31T12:00:00.000Z'),
          },
        }),
      }),
    );

    jest.useRealTimers();
  });

  it('defaults nearby post queries to the shared time window when omitted', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-02-01T12:00:00.000Z'));
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findNearbyPosts({
      latitude: 0,
      longitude: 0,
      distance: 200,
    });

    expect(prismaService.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2024-01-31T12:00:00.000Z'),
          },
        }),
      }),
    );

    jest.useRealTimers();
  });

  it('selects only public author fields for nearby posts', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findNearbyPosts({
      latitude: 0,
      longitude: 0,
      distance: 200,
    });

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

  it('uses stable keyset pagination when a cursor is present', async () => {
    const cursorCreatedAt = new Date('2024-01-31T10:00:00.000Z');
    const prismaService = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          createdAt: cursorCreatedAt,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prismaService);

    await service.findNearbyPosts({
      latitude: 0,
      longitude: 0,
      distance: 200,
      cursor: '7',
    });

    expect(prismaService.post.findUnique).toHaveBeenCalledWith({
      select: {
        createdAt: true,
        id: true,
      },
      where: {
        id: 7,
      },
    });

    const query = prismaService.post.findMany.mock.calls[0][0];

    expect(query).not.toHaveProperty('cursor');
    expect(query).not.toHaveProperty('skip');
    expect(query.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    expect(query.where).toEqual(
      expect.objectContaining({
        AND: [
          {
            OR: [
              {
                createdAt: {
                  lt: cursorCreatedAt,
                },
              },
              {
                createdAt: cursorCreatedAt,
                id: {
                  lt: 7,
                },
              },
            ],
          },
        ],
      }),
    );
  });

  it('rejects malformed nearby post cursors before querying posts', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findNearbyPosts({
        latitude: 0,
        longitude: 0,
        distance: 200,
        cursor: 'not-a-number',
      }),
    ).rejects.toThrow('cursor must be a positive integer');

    expect(prismaService.post.findMany).not.toHaveBeenCalled();
    expect(prismaService.post.findUnique).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying nearby posts', async () => {
    const prismaService = {
      post: {
        findMany: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.findNearbyPosts({
        latitude: 0,
        longitude: 0,
        distance: 200,
        userId: 'not-a-user',
      }),
    ).rejects.toThrow('userId must be a positive integer');

    expect(usersService.findBlockedUsersIds).not.toHaveBeenCalled();
    expect(prismaService.post.findMany).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying a single post', async () => {
    const prismaService = {
      post: {
        findFirst: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(service.findPost(10, 'not-a-user')).rejects.toThrow(
      'userId must be a positive integer',
    );

    expect(prismaService.post.findFirst).not.toHaveBeenCalled();
  });

  it('soft deletes posts so reports and engagement history stay available', async () => {
    const prismaService = {
      post: {
        delete: jest.fn(),
        update: jest.fn().mockResolvedValue(createPost(10, 0, 0)),
      },
    };
    const service = createService(prismaService);

    await service.deletePost(10);

    expect(prismaService.post.update).toHaveBeenCalledWith({
      data: {
        isActive: false,
      },
      where: {
        id: 10,
      },
    });
    expect(prismaService.post.delete).not.toHaveBeenCalled();
  });
});
