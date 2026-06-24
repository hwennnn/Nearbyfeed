import { type LiveUpdate, type Post } from '../types';

const now = new Date();

export const demoPosts: Post[] = [
  {
    id: 9001,
    title: 'Sunset pop-up by the library steps',
    content:
      'Someone brought a tiny projector and the whole block is watching music videos. Bring snacks if you are close.',
    latitude: 37.3238,
    longitude: -122.0312,
    locationName: 'Mariani Avenue, Cupertino',
    fullLocationName: 'Mariani Avenue, Cupertino, CA',
    images: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    ],
    points: 42,
    createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    authorId: 1,
    author: {
      id: 1,
      username: 'bobby',
      email: 'bobby@example.com',
      image: null,
    },
    commentsCount: 8,
    poll: {
      id: 3001,
      postId: 9001,
      createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
      votingLength: 1,
      participantsCount: 23,
      options: [
        { id: 1, text: 'pull up', pollId: 3001, voteCount: 16, order: 0 },
        { id: 2, text: 'too packed', pollId: 3001, voteCount: 7, order: 1 },
      ],
    },
    location: {
      latitude: 37.3238,
      longitude: -122.0312,
      name: 'Library steps',
      formattedAddress: 'Cupertino Library, CA',
    },
  },
  {
    id: 9002,
    title: 'Food trucks are lining up near the park',
    content:
      'Tacos, mango sticky rice, and a coffee cart. The matcha one has a wild lavender drink today.',
    latitude: 37.3217,
    longitude: -122.0282,
    locationName: 'Civic Center Park',
    fullLocationName: 'Civic Center Park, Cupertino, CA',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    ],
    points: 31,
    createdAt: new Date(now.getTime() - 48 * 60 * 1000).toISOString(),
    authorId: 2,
    author: {
      id: 2,
      username: 'mina',
      email: 'mina@example.com',
      image: null,
    },
    commentsCount: 14,
    poll: null,
    location: {
      latitude: 37.3217,
      longitude: -122.0282,
      name: 'Civic Center Park',
      formattedAddress: 'Cupertino, CA',
    },
  },
  {
    id: 9003,
    title: 'Street lights out on the bike lane',
    content:
      'Heads up if you are riding through tonight. The crossing is darker than usual and cars are not slowing down.',
    latitude: 37.3262,
    longitude: -122.0343,
    locationName: 'Stevens Creek Boulevard',
    fullLocationName: 'Stevens Creek Boulevard, Cupertino, CA',
    images: [],
    points: 19,
    createdAt: new Date(now.getTime() - 92 * 60 * 1000).toISOString(),
    authorId: 3,
    author: {
      id: 3,
      username: 'ari',
      email: 'ari@example.com',
      image: null,
    },
    commentsCount: 5,
    poll: null,
    location: null,
  },
];

export const demoLiveUpdates: LiveUpdate[] = [
  {
    id: 'demo-live-1',
    title: 'Open mic queue is moving fast',
    summary:
      'Local posts say the cafe stage has short sets and plenty of room outside.',
    url: 'https://x.com/nearbyfeed/status/91001',
    source: 'x',
    occurredAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    tags: ['music', 'nearby'],
  },
  {
    id: 'demo-live-2',
    title: 'Traffic bunching near the market',
    summary:
      'Several people are reporting a slow turn lane near the plaza entrance.',
    url: 'https://x.com/nearbyfeed/status/91002',
    source: 'x',
    occurredAt: new Date(now.getTime() - 34 * 60 * 1000).toISOString(),
    tags: ['heads-up'],
  },
];
