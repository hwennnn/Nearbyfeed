import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FilterService } from 'src/filter/filter.service';
import { type VotePollDto } from 'src/posts/dto';
import { type PollWithOptions, type VotePollResult } from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { isPollExpired } from 'src/utils';

@Injectable()
export class PollService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
  ) {}

  async findPoll(
    postId: number,
    pollId: number,
    userId?: string,
  ): Promise<PollWithOptions | null> {
    const selectVotes =
      userId !== undefined
        ? {
            where: {
              userId: +userId,
            },
          }
        : false;

    const pollWithOptions = await this.prismaService.poll
      .findFirst({
        where: {
          id: pollId,
          postId,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          votingLength: true,
          participantsCount: true,
          options: true,
          pollVotes: selectVotes,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find poll ${pollId}`,
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException(`Failed to find comment ${pollId}`);
      });

    if (pollWithOptions === null) return null;

    // transform the votes array into single vote variable
    // -> this is to indicate whether the current user vote or not
    const parsedPoll = {
      ...pollWithOptions,
      vote:
        pollWithOptions.pollVotes !== undefined &&
        pollWithOptions.pollVotes.length > 0
          ? pollWithOptions.pollVotes[0]
          : undefined,
    };

    const { pollVotes: _, ...result } = parsedPoll;

    return result;
  }

  async votePoll(
    votePollDto: VotePollDto,
    postId: number,
    pollId: number,
    userId: number,
  ): Promise<VotePollResult> {
    const pollOptionId = votePollDto.pollOptionId;

    const poll = await this.prismaService.poll
      .findFirst({
        where: {
          id: pollId,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to vote the poll',
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException('Failed to vote the poll');
      });

    if (
      poll === null ||
      isPollExpired(poll.createdAt.getTime(), poll.votingLength)
    ) {
      throw new BadRequestException('Failed to vote the poll');
    }

    const [resultVote, resultPoll, resultPollOption] = await this.prismaService
      .$transaction([
        this.prismaService.pollVote.create({
          data: {
            pollOptionId,
            userId,
            pollId,
          },
        }),
        this.prismaService.poll.update({
          data: {
            participantsCount: {
              increment: 1,
            },
          },
          where: {
            id: pollId,
            postId,
          },
        }),
        this.prismaService.pollOption.update({
          data: {
            voteCount: {
              increment: 1,
            },
          },
          where: {
            id: pollOptionId,
            pollId,
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to vote the poll',
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException('Failed to vote the poll');
      });

    return {
      vote: resultVote,
      poll: resultPoll,
      pollOption: resultPollOption,
    };
  }
}
