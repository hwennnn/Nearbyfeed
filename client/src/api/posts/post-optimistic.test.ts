import type { User } from '../types';
import { buildOptimisticPost } from './post-optimistic';

const user: User = {
  blockedUsers: [],
  createdAt: new Date('2026-06-23T08:00:00Z'),
  email: 'mina@example.com',
  hasPassword: true,
  id: 7,
  image: null,
  providers: [],
  updatedAt: new Date('2026-06-23T08:00:00Z'),
  username: 'mina',
};

describe('buildOptimisticPost', () => {
  it('keeps latitude and longitude in their correct fields', () => {
    expect(
      buildOptimisticPost({
        author: user,
        id: 123,
        input: {
          content: 'tiny projector night is drawing a crowd',
          latitude: 37.323,
          longitude: -122.0322,
          title: 'Library steps are buzzing',
        },
      }),
    ).toEqual(
      expect.objectContaining({
        latitude: 37.323,
        longitude: -122.0322,
      }),
    );
  });
});
