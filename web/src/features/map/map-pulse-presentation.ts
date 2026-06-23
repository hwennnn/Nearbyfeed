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
    { label: 'outside' as const, value: metrics.liveCount.toString() },
    { label: 'replies' as const, value: metrics.replyCount.toString() },
  ];

  if (metrics.postCount === 0 && metrics.liveCount === 0) {
    return {
      detail: 'Open the radius or post the first signal people nearby can see.',
      headline: 'No pulse on this block yet',
      metrics: storyMetrics,
      kicker: 'quiet zone',
      tone: 'quiet',
    };
  }

  const headline =
    metrics.liveCount > 0
      ? `${formatCount(metrics.liveCount, 'outside signal', 'outside signals')} nearby`
      : getFeaturedMapPost(posts)?.title ?? 'Nearby pulse is forming';
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
          'outside signal',
          'outside signals',
        )} surfaced from X in range.`;

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
  const xSignals = formatCount(metrics.liveCount, 'X signal', 'X signals');

  if (metrics.postCount === 0 && metrics.liveCount === 0) {
    return {
      action: 'Start the pulse',
      body: 'No drops yet. Open the radius or start the first nearby signal.',
      eyebrow: 'vibe check',
      title: 'Quiet grid',
      tone: 'quiet',
    };
  }

  if (metrics.liveCount > 0 && metrics.liveCount >= metrics.postCount) {
    return {
      action: 'Scan live stack',
      body: `${xSignals} ${metrics.liveCount === 1 ? 'is' : 'are'} moving around ${drops}.`,
      eyebrow: 'vibe check',
      title: 'Outside chatter is spiking',
      tone:
        metrics.level === 'quiet' || metrics.level === 'warming'
          ? 'rising'
          : metrics.level,
    };
  }

  if (metrics.replyCount >= 8) {
    return {
      action: 'Open the hottest thread',
      body: `${replies} across ${threadDrops}. Jump in before the block moves on.`,
      eyebrow: 'vibe check',
      title: 'The block chat is awake',
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
    title: 'Fresh signals nearby',
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
      action: 'Start the pulse',
      detail: `No drops or outside signals inside ${locationName}. Widen the radius or start the first pulse.`,
      headline: 'Quiet grid',
      kicker: 'live sheet',
      statChips,
      tone: 'quiet',
    };
  }

  const activeParts = [
    metrics.liveCount > 0
      ? formatCount(metrics.liveCount, 'X signal', 'X signals')
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
      ? 'Outside chatter is leading'
      : metrics.replyCount >= 8
        ? 'Block chat is moving'
        : metrics.pollCount > 0
          ? 'A local vote is shaping the room'
          : 'Fresh nearby pulse';

  const action =
    metrics.liveCount > 0 && metrics.liveCount >= metrics.postCount
      ? 'Scan X signals'
      : metrics.replyCount >= 8
        ? 'Open hottest thread'
        : metrics.pollCount > 0
          ? 'Vote before it flips'
          : 'Catch up fast';

  return {
    action,
    detail: `${joinReadableList(activeParts)} ${
      activeParts.length === 1 ? 'is' : 'are'
    } active around ${locationName}.`,
    headline,
    kicker: 'live sheet',
    statChips,
    tone: metrics.level,
  };
};
