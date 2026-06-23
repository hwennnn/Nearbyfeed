import { formatSingularPlural } from '@nearbyfeed/shared';
import { type LiveUpdate, type Post } from '../../types';
import { getFeaturedMapPost, getMapPostScore } from './map-post-presentation';
import {
  type MapLiveSheetSummary,
  type MapLiveStory,
  type MapPulseLevel,
  type MapVibeSnapshot,
} from './map-types';

export const getMapPulseMetrics = (
  posts: Post[],
  liveUpdates: LiveUpdate[],
): {
  level: MapPulseLevel;
  liveCount: number;
  pollCount: number;
  postCount: number;
  replyCount: number;
  score: number;
} => {
  const replyCount = posts.reduce((total, post) => total + post.commentsCount, 0);
  const pollCount = posts.filter(
    (post) => post.poll !== null && post.poll !== undefined,
  ).length;
  const score =
    posts.reduce((total, post) => total + getMapPostScore(post), 0) +
    liveUpdates.length * 6;

  const level: MapPulseLevel =
    score >= 120
      ? 'surging'
      : score >= 45
        ? 'rising'
        : posts.length > 0
          ? 'warming'
          : 'quiet';

  return {
    level,
    liveCount: liveUpdates.length,
    pollCount,
    postCount: posts.length,
    replyCount,
    score,
  };
};

const formatCount = (
  value: number,
  singular: string,
  plural: string,
): string =>
  formatSingularPlural({
    empty: `0 ${plural}`,
    plural,
    singular,
    value,
  });

const joinReadableList = (parts: string[]): string => {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;

  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
};

export const getMapLiveStory = (
  posts: Post[],
  liveUpdates: LiveUpdate[],
): MapLiveStory => {
  const metrics = getMapPulseMetrics(posts, liveUpdates);
  const storyMetrics = [
    { label: 'drops' as const, value: metrics.postCount.toString() },
    { label: 'X live' as const, value: metrics.liveCount.toString() },
    { label: 'replies' as const, value: metrics.replyCount.toString() },
  ];

  if (metrics.postCount === 0 && metrics.liveCount === 0) {
    return {
      detail: 'Open the radius or post what people nearby should know.',
      headline: 'Nothing nearby yet',
      metrics: storyMetrics,
      kicker: 'quiet nearby',
      tone: 'quiet',
    };
  }

  const headline =
    metrics.liveCount > 0
      ? `${formatCount(metrics.liveCount, 'X mention', 'X mentions')} nearby`
      : getFeaturedMapPost(posts)?.title ?? 'Nearby posts are warming up';
  const detailParts = [
    metrics.postCount > 0
      ? formatCount(metrics.postCount, 'drop', 'drops')
      : null,
    metrics.replyCount > 0
      ? formatCount(metrics.replyCount, 'reply', 'replies')
      : null,
    metrics.pollCount > 0 ? formatCount(metrics.pollCount, 'poll', 'polls') : null,
  ].filter((part): part is string => part !== null);
  const detail =
    detailParts.length > 0
      ? `${joinReadableList(detailParts)} ${
          detailParts.length === 1 ? 'is' : 'are'
        } already in range.`
      : `${formatCount(
          metrics.liveCount,
          'X mention',
          'X mentions',
        )} surfaced in range.`;

  return {
    detail,
    headline,
    metrics: storyMetrics,
    kicker: `${metrics.level} nearby`,
    tone: metrics.level,
  };
};

export const getMapVibeSnapshot = (
  posts: Post[],
  liveUpdates: LiveUpdate[],
): MapVibeSnapshot => {
  const metrics = getMapPulseMetrics(posts, liveUpdates);
  const drops = formatCount(metrics.postCount, 'nearby drop', 'nearby drops');
  const threadDrops = formatCount(metrics.postCount, 'drop', 'drops');
  const replies = formatCount(metrics.replyCount, 'reply', 'replies');
  const xMentions = formatCount(metrics.liveCount, 'X mention', 'X mentions');

  if (metrics.postCount === 0 && metrics.liveCount === 0) {
    return {
      action: 'Post first',
      body: 'No drops yet. Open the radius or post what is happening.',
      eyebrow: 'vibe check',
      title: 'Quiet nearby',
      tone: 'quiet',
    };
  }

  if (metrics.liveCount > 0 && metrics.liveCount >= metrics.postCount) {
    return {
      action: 'Scan X',
      body: `${xMentions} ${metrics.liveCount === 1 ? 'is' : 'are'} moving around ${drops}.`,
      eyebrow: 'vibe check',
      title: 'X is moving nearby',
      tone:
        metrics.level === 'quiet' || metrics.level === 'warming'
          ? 'rising'
          : metrics.level,
    };
  }

  if (metrics.replyCount >= 8) {
    return {
      action: 'Open top thread',
      body: `${replies} across ${threadDrops}. Jump in while it is active.`,
      eyebrow: 'vibe check',
      title: 'People are talking nearby',
      tone: metrics.level,
    };
  }

  if (metrics.pollCount > 0) {
    return {
      action: 'Vote before it flips',
      body: `${formatCount(metrics.pollCount, 'poll', 'polls')} ${
        metrics.pollCount === 1 ? 'is' : 'are'
      } shaping what people do next.`,
      eyebrow: 'vibe check',
      title: 'The block is voting',
      tone: metrics.level,
    };
  }

  return {
    action: 'Catch up fast',
    body: `${drops} ${metrics.postCount === 1 ? 'is' : 'are'} warming up nearby.`,
    eyebrow: 'vibe check',
    title: 'Fresh posts nearby',
    tone: metrics.level,
  };
};

export const getMapLiveSheetSummary = (
  locationName: string,
  posts: Post[],
  liveUpdates: LiveUpdate[],
): MapLiveSheetSummary => {
  const metrics = getMapPulseMetrics(posts, liveUpdates);
  const statChips = [
    { label: 'drops' as const, value: metrics.postCount.toString() },
    { label: 'X live' as const, value: metrics.liveCount.toString() },
    { label: 'replies' as const, value: metrics.replyCount.toString() },
  ];

  if (metrics.postCount === 0 && metrics.liveCount === 0) {
    return {
      action: 'Post first',
      detail: `No drops or X mentions inside ${locationName}. Widen the radius or post first.`,
      headline: 'Quiet nearby',
      kicker: 'nearby now',
      statChips,
      tone: 'quiet',
    };
  }

  const activeParts = [
    metrics.liveCount > 0
      ? formatCount(metrics.liveCount, 'X mention', 'X mentions')
      : null,
    metrics.postCount > 0
      ? formatCount(metrics.postCount, 'drop', 'drops')
      : null,
    metrics.replyCount > 0
      ? formatCount(metrics.replyCount, 'reply', 'replies')
      : null,
  ].filter((part): part is string => part !== null);
  const headline =
    metrics.liveCount > 0 && metrics.liveCount >= metrics.postCount
      ? 'X is moving nearby'
      : metrics.replyCount >= 8
        ? 'People are talking nearby'
        : metrics.pollCount > 0
          ? 'A local vote is shaping the room'
          : 'Fresh posts nearby';

  const action =
    metrics.liveCount > 0 && metrics.liveCount >= metrics.postCount
      ? 'Scan X'
      : metrics.replyCount >= 8
        ? 'Open top thread'
        : metrics.pollCount > 0
          ? 'Vote before it flips'
          : 'Catch up fast';

  return {
    action,
    detail: `${joinReadableList(activeParts)} ${
      activeParts.length === 1 ? 'is' : 'are'
    } active around ${locationName}.`,
    headline,
    kicker: 'nearby now',
    statChips,
    tone: metrics.level,
  };
};
