import {
  DEFAULT_DISTANCE_METERS,
  DEFAULT_COMMENT_SORT,
  DEFAULT_TIME_WINDOW,
  type ReportReason,
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import {
  type AuthToken,
  type Comment,
  type CommentSort,
  type CommentWithPost,
  type Coordinates,
  type LiveUpdate,
  type Post,
  type Session,
  type User,
} from '../types';
import { getClientId, readSession } from './session';

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export type PostsParams = {
  latitude: number;
  longitude: number;
  distance?: DistanceMeters;
  timeWindow?: TimeWindow;
  cursor?: string;
  take?: number;
};

export const buildPostsUrl = (params: PostsParams): string => {
  const searchParams = new URLSearchParams({
    latitude: params.latitude.toString(),
    longitude: params.longitude.toString(),
    distance: (params.distance ?? DEFAULT_DISTANCE_METERS).toString(),
    timeWindow: params.timeWindow ?? DEFAULT_TIME_WINDOW,
  });

  if (params.cursor !== undefined) searchParams.set('cursor', params.cursor);
  if (params.take !== undefined) searchParams.set('take', params.take.toString());

  return `${API_URL}/posts?${searchParams.toString()}`;
};

const authHeaders = (tokens?: AuthToken): HeadersInit => {
  const session = readSession();
  const accessToken = tokens?.accessToken ?? session?.tokens.accessToken;

  return accessToken === undefined
    ? {}
    : {
        Authorization: `Bearer ${accessToken}`,
      };
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const fetchPosts = async (
  params: PostsParams,
): Promise<{ posts: Post[]; hasMore: boolean }> => {
  const response = await fetch(buildPostsUrl(params), {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Failed to fetch posts');
  return (await response.json()) as { posts: Post[]; hasMore: boolean };
};

export const fetchPost = async (postId: number): Promise<Post | null> =>
  await request(`/posts/${postId}`);

export const fetchLocationName = async (
  coordinates: Coordinates,
): Promise<{ locationName: string; displayName: string } | null> => {
  const searchParams = new URLSearchParams({
    latitude: coordinates.latitude.toString(),
    longitude: coordinates.longitude.toString(),
  });

  return await request(`/geocoding/location-name?${searchParams.toString()}`);
};

export const fetchLiveUpdates = async (
  params: PostsParams & { locationName?: string },
): Promise<LiveUpdate[]> => {
  const searchParams = new URLSearchParams({
    latitude: params.latitude.toString(),
    longitude: params.longitude.toString(),
    distance: (params.distance ?? DEFAULT_DISTANCE_METERS).toString(),
    timeWindow: params.timeWindow ?? DEFAULT_TIME_WINDOW,
  });

  if (params.locationName !== undefined) {
    searchParams.set('locationName', params.locationName);
  }

  const response = await request<{ updates: LiveUpdate[] }>(
    `/live/nearby?${searchParams.toString()}`,
  );
  return response.updates;
};

export const login = async (email: string, password: string): Promise<Session> =>
  await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export type PendingRegistration = {
  pendingUser: { id: string; email: string };
  sessionId: string;
};

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<PendingRegistration> =>
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

export const buildVerifyEmailPath = (pendingUserId: string): string =>
  `/auth/verify-email/${encodeURIComponent(pendingUserId)}`;

export const verifyEmail = async ({
  otpCode,
  pendingUserId,
  sessionId,
}: {
  otpCode: string;
  pendingUserId: string;
  sessionId: string;
}): Promise<Session> =>
  await request(buildVerifyEmailPath(pendingUserId), {
    method: 'POST',
    body: JSON.stringify({ otpCode, sessionId }),
  });

export const resendVerifyEmail = async (
  pendingUserId: string,
): Promise<{ sessionId: string }> =>
  await request(`${buildVerifyEmailPath(pendingUserId)}/resend`, {
    method: 'PUT',
  });

export const votePost = async (
  postId: number,
  value: number,
): Promise<{ post: Post }> =>
  await request(`/posts/${postId}/vote`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });

export const fetchComments = async (
  postId: number,
  sort: CommentSort = DEFAULT_COMMENT_SORT,
): Promise<{ comments: Comment[]; hasMore: boolean }> =>
  await request(`/posts/${postId}/comments?sort=${sort}`);

export const addComment = async (
  postId: number,
  content: string,
): Promise<Comment> =>
  await request(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const reportPost = async (
  postId: number,
  reason: ReportReason,
): Promise<void> =>
  await request('/reports/posts', {
    method: 'POST',
    body: JSON.stringify({
      postId: postId.toString(),
      reason,
    }),
  });

export const reportComment = async (
  commentId: number,
  reason: ReportReason,
): Promise<void> =>
  await request('/reports/comments', {
    method: 'POST',
    body: JSON.stringify({
      commentId: commentId.toString(),
      reason,
    }),
  });

export type BlockUserInput = {
  blockedId: number;
  userId: number;
};

export const blockUser = async ({
  blockedId,
  userId,
}: BlockUserInput): Promise<void> =>
  await request(`/users/${userId}/block/${blockedId}`, {
    method: 'POST',
  });

export const unblockUser = async ({
  blockedId,
  userId,
}: BlockUserInput): Promise<void> =>
  await request(`/users/${userId}/block/${blockedId}`, {
    method: 'DELETE',
  });

export const fetchSelf = async (): Promise<User> => await request('/users/self');

export const fetchMyPosts = async (
  userId: number,
): Promise<{ posts: Post[]; hasMore: boolean }> =>
  await request(`/users/${userId}/posts`);

export const fetchMyComments = async (
  userId: number,
): Promise<{ comments: CommentWithPost[]; hasMore: boolean }> =>
  await request(`/users/${userId}/comments`);

export type CreatePostInput = {
  title: string;
  content?: string;
  coordinates: Coordinates;
  images: File[];
  poll?: {
    votingLength: number;
    options: string[];
  };
  location?: {
    name: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  };
};

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  const formData = new FormData();
  formData.append('title', input.title);
  if (input.content !== undefined && input.content.length > 0) {
    formData.append('content', input.content);
  }
  formData.append('latitude', input.coordinates.latitude.toString());
  formData.append('longitude', input.coordinates.longitude.toString());
  input.images.forEach((file) => formData.append('images', file));

  input.poll?.options.forEach((option) =>
    formData.append('poll[options][]', option),
  );
  if (input.poll !== undefined) {
    formData.append('poll[votingLength]', input.poll.votingLength.toString());
  }
  if (input.location !== undefined) {
    formData.append('location[name]', input.location.name);
    formData.append('location[formattedAddress]', input.location.formattedAddress);
    formData.append('location[latitude]', input.location.latitude.toString());
    formData.append('location[longitude]', input.location.longitude.toString());
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to create post');
  return (await response.json()) as Post;
};

export const captureEvent = async (
  name: string,
  properties: Record<string, unknown> = {},
  route?: string,
): Promise<void> => {
  await request('/observability/events', {
    method: 'POST',
    body: JSON.stringify({
      name,
      clientTimestamp: new Date().toISOString(),
      route,
      sessionId: getClientId(),
      properties,
    }),
  }).catch(() => undefined);
};
