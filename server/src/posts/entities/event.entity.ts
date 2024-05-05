import { type Event, type EventParticipation } from '@prisma/client';

export type EventWithParticipant = Event & {
  participant?: EventParticipation;
};

export interface EventParticipationResult {
  event: Event;
  eventParticipation: EventParticipation;
}
