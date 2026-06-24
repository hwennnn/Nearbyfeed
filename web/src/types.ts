import {
  type CommentSort,
  type NormalizedLiveUpdate,
} from '@nearbyfeed/shared';

export type { CommentSort };

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type User = {
  id: number;
  username: string;
  email: string;
  image: string | null;
  hasPassword?: boolean;
  blockedUsers?: Array<{
    id: number;
    username: string;
    image: string | null;
  }>;
  providers?: Array<{
    providerName: 'EMAIL' | 'GOOGLE' | 'APPLE';
    isActive: boolean;
    userId: number;
  }>;
};

export type PostLocation = {
  id?: number;
  latitude: number;
  longitude: number;
  name: string;
  formattedAddress: string;
};

export type PollOption = {
  id: number;
  text: string;
  pollId: number;
  voteCount: number;
  order: number;
};

export type PollVote = {
  id: number;
  userId: number;
  pollId: number;
  pollOptionId: number;
};

export type Poll = {
  id: number;
  postId: number;
  createdAt?: string;
  updatedAt?: string;
  votingLength: number;
  participantsCount: number;
  options: PollOption[];
  vote?: PollVote;
};

export type PostLike = {
  id: number;
  value: number;
  postId: number;
  userId: number;
};

export type Post = {
  id: number;
  title: string;
  content?: string | null;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  fullLocationName?: string | null;
  images?: string[] | null;
  points: number;
  createdAt?: string;
  updatedAt?: string;
  authorId?: number;
  author?: User;
  like?: PostLike;
  commentsCount: number;
  poll?: Poll | null;
  location?: PostLocation | null;
  isOptimistic?: boolean;
};

export type Comment = {
  id: number;
  content: string;
  createdAt: string;
  postId: number;
  points: number;
  author?: User;
  replies?: Comment[];
};

export type CommentWithPost = Comment & {
  post: Post;
};

export type LiveUpdate = NormalizedLiveUpdate;

export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

export type Session = {
  tokens: AuthToken;
  user: User;
};
