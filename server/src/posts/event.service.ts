import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  type EventParticipationResult,
  type EventWithParticipant,
} from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { isEventExpired } from 'src/utils';

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async findEvent(
    postId: number,
    eventId: number,
    userId?: string,
  ): Promise<EventWithParticipant | null> {
    const selectParticipants =
      userId !== undefined
        ? {
            where: {
              userId: +userId,
            },
          }
        : false;

    const eventWithParticipants = await this.prismaService.event
      .findFirst({
        where: {
          id: eventId,
          postId,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          latitude: true,
          longitude: true,
          locationName: true,
          fullLocationName: true,
          postId: true,
          participantsCount: true,
          participants: selectParticipants,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find event ${eventId}`,
          e instanceof Error ? e.stack : undefined,
          EventService.name,
        );

        throw new BadRequestException(`Failed to find event ${eventId}`);
      });

    if (eventWithParticipants === null) return null;

    // transform the pariticpants array into single participant variable
    // -> this is to indicate whether the current user paricipates or not
    const parsedEvent = {
      ...eventWithParticipants,
      participant:
        eventWithParticipants.participants !== undefined &&
        eventWithParticipants.participants.length > 0
          ? eventWithParticipants.participants[0]
          : undefined,
    };

    const { participants: _, ...result } = parsedEvent;

    return result;
  }

  async participateEvent(
    isAttending: boolean,
    postId: number,
    eventId: number,
    userId: number,
  ): Promise<EventParticipationResult> {
    const event = await this.prismaService.event
      .findFirst({
        where: {
          id: eventId,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to participate the event',
          e instanceof Error ? e.stack : undefined,
          EventService.name,
        );

        throw new BadRequestException('Failed to participate the event');
      });

    if (
      event !== null &&
      isEventExpired(
        event?.endDate !== undefined && event.endDate !== null
          ? event.endDate.getTime()
          : event.startDate.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Failed to participate the event. The event is already expired',
      );
    }

    const eventParticipation =
      await this.prismaService.eventParticipation.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    let incrementValue = isAttending ? 1 : 0;

    // If the user already participated the event before
    if (eventParticipation !== null) {
      // If the user's vote is the same as the current vote
      if (eventParticipation.isAttending === isAttending) {
        // nothing changed
        incrementValue = 0;
      } else {
        if (isAttending) {
          incrementValue = 1;
        } else {
          incrementValue = -1;
        }
      }
    }

    const [resultParticipation, resultEvent] = await this.prismaService
      .$transaction([
        this.prismaService.eventParticipation.upsert({
          where: {
            eventId_userId: {
              eventId,
              userId,
            },
          },
          update: {
            isAttending,
          },
          create: {
            eventId,
            userId,
            isAttending,
          },
        }),
        this.prismaService.event.update({
          data: {
            participantsCount: {
              increment: incrementValue,
            },
          },
          where: {
            id: eventId,
            postId,
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to participate the event',
          e instanceof Error ? e.stack : undefined,
          EventService.name,
        );

        throw new BadRequestException('Failed to participate the event');
      });

    return {
      eventParticipation: resultParticipation,
      event: resultEvent,
    };
  }
}
