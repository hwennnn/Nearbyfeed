import { type Post } from '../../types';
import { type MapPostTone } from './map-types';

const getPollCount = (post: Post): number =>
  post.poll?.participantsCount ??
  post.poll?.options.reduce((total, option) => total + option.voteCount, 0) ??
  0;

export const getMapPostScore = (post: Post): number =>
  post.points + post.commentsCount * 2 + getPollCount(post);

export const getMapPostTone = (post: Post): MapPostTone => {
  if (post.points >= 40 || post.commentsCount >= 10) return 'hot';
  if (post.commentsCount > 0) return 'chat';
  if (post.poll !== null && post.poll !== undefined) return 'poll';
  return 'fresh';
};

export const getMapMarkerLabel = (post: Post): string => {
  if (post.commentsCount > 0) return post.commentsCount.toString();
  if (post.poll !== null && post.poll !== undefined) return 'poll';
  if (post.points > 0) return post.points.toString();
  return 'new';
};

export const getMapPostSignalLabel = (post: Post): string => {
  const tone = getMapPostTone(post);

  if (tone === 'hot') return 'hot thread';
  if (tone === 'poll') return 'live poll';
  if (tone === 'chat') return 'people talking';
  return 'fresh drop';
};

export const getFeaturedMapPost = (posts: Post[]): Post | undefined =>
  [...posts].sort(
    (left, right) => getMapPostScore(right) - getMapPostScore(left),
  )[0];
