import { isPollExpired } from '@nearbyfeed/shared';
import { PollService } from './poll.service';

describe('PollService', () => {
  const logger = { error: jest.fn(), log: jest.fn() };
  const filterService = { filterText: jest.fn((value: string) => value) };

  const createService = (prismaService: unknown): PollService =>
    new PollService(
      prismaService as any,
      logger as any,
      filterService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses shared poll expiration semantics at the exact closing instant', () => {
    expect(
      isPollExpired(
        new Date('2026-06-23T08:00:00.000Z'),
        1,
        new Date('2026-06-24T07:59:59.999Z'),
      ),
    ).toBe(false);
    expect(
      isPollExpired(
        new Date('2026-06-23T08:00:00.000Z'),
        1,
        new Date('2026-06-24T08:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('rejects votes for options that do not belong to the route poll', async () => {
    const prismaService = {
      poll: {
        findFirst: jest.fn().mockResolvedValue({
          id: 10,
          postId: 1,
          createdAt: new Date(),
          votingLength: 7,
        }),
        update: jest.fn(),
      },
      pollOption: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      pollVote: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const service = createService(prismaService);

    await expect(
      service.votePoll({ pollOptionId: 999 }, 1, 10, 5),
    ).rejects.toThrow('Failed to vote the poll');
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('returns the existing vote without changing counters when the same vote is retried', async () => {
    const poll = {
      id: 10,
      postId: 1,
      createdAt: new Date(),
      votingLength: 7,
      participantsCount: 4,
    };
    const pollOption = {
      id: 99,
      pollId: 10,
      text: 'pull up',
      voteCount: 4,
      order: 0,
    };
    const vote = {
      id: 123,
      userId: 5,
      pollId: 10,
      pollOptionId: 99,
    };
    const prismaService = {
      poll: {
        findFirst: jest.fn().mockResolvedValue(poll),
        update: jest.fn(),
      },
      pollOption: {
        findFirst: jest.fn().mockResolvedValue(pollOption),
        update: jest.fn(),
      },
      pollVote: {
        findUnique: jest.fn().mockResolvedValue(vote),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = createService(prismaService);

    await expect(service.votePoll({ pollOptionId: 99 }, 1, 10, 5)).resolves.toEqual({
      vote,
      poll,
      pollOption,
    });
    expect(prismaService.pollVote.findUnique).toHaveBeenCalledWith({
      where: {
        pollId_userId: {
          pollId: 10,
          userId: 5,
        },
      },
    });
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('rejects attempts to change an existing poll vote without touching counters', async () => {
    const prismaService = {
      poll: {
        findFirst: jest.fn().mockResolvedValue({
          id: 10,
          postId: 1,
          createdAt: new Date(),
          votingLength: 7,
        }),
        update: jest.fn(),
      },
      pollOption: {
        findFirst: jest.fn().mockResolvedValue({
          id: 99,
          pollId: 10,
          text: 'pull up',
          voteCount: 4,
          order: 0,
        }),
        update: jest.fn(),
      },
      pollVote: {
        findUnique: jest.fn().mockResolvedValue({
          id: 123,
          userId: 5,
          pollId: 10,
          pollOptionId: 88,
        }),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = createService(prismaService);

    await expect(
      service.votePoll({ pollOptionId: 99 }, 1, 10, 5),
    ).rejects.toThrow('Poll already voted');
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('rejects malformed optional user ids before querying a poll', async () => {
    const prismaService = {
      poll: {
        findFirst: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(service.findPoll(1, 10, 'not-a-user')).rejects.toThrow(
      'userId must be a positive integer',
    );
    expect(prismaService.poll.findFirst).not.toHaveBeenCalled();
  });
});
